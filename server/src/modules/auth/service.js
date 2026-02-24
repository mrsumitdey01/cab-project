const bcrypt = require('bcryptjs');
const { ApiError } = require('../../lib/errors');
const User = require('../../../models/User');
const RefreshToken = require('../../../models/RefreshToken');
const { hashToken, signAccessToken, signRefreshToken, verifyRefreshToken } = require('./tokens');

async function register(input, config) {
  const existing = await User.findOne({ email: input.email.toLowerCase() });
  if (existing) {
    throw new ApiError({
      status: 409,
      title: 'Conflict',
      detail: 'Email already registered.',
      code: 'email_exists',
    });
  }

  const passwordHash = await bcrypt.hash(input.password, config.bcryptRounds);
  const user = await User.create({
    name: input.name,
    email: input.email.toLowerCase(),
    passwordHash,
    role: 'user',
  });

  return createSession(user, config);
}

async function login(input, config) {
  const user = await User.findOne({ email: input.email.toLowerCase() });
  if (!user) {
    throw new ApiError({ status: 401, title: 'Unauthorized', detail: 'Invalid credentials.', code: 'invalid_credentials' });
  }

  const validPassword = await bcrypt.compare(input.password, user.passwordHash);
  if (!validPassword) {
    throw new ApiError({ status: 401, title: 'Unauthorized', detail: 'Invalid credentials.', code: 'invalid_credentials' });
  }

  return createSession(user, config);
}

async function refresh(refreshTokenRaw, config) {
  let payload;
  try {
    payload = verifyRefreshToken(refreshTokenRaw, config);
  } catch (err) {
    throw new ApiError({ status: 401, title: 'Unauthorized', detail: 'Invalid refresh token.', code: 'invalid_refresh' });
  }

  const tokenHash = hashToken(refreshTokenRaw);
  const stored = await RefreshToken.findOne({
    userId: payload.sub,
    tokenHash,
    revokedAt: null,
    expiresAt: { $gt: new Date() },
  });

  if (!stored) {
    throw new ApiError({ status: 401, title: 'Unauthorized', detail: 'Refresh token is not active.', code: 'refresh_inactive' });
  }

  stored.revokedAt = new Date();
  await stored.save();

  const user = await User.findById(payload.sub);
  if (!user) {
    throw new ApiError({ status: 401, title: 'Unauthorized', detail: 'User not found for token.', code: 'user_not_found' });
  }

  return createSession(user, config);
}

async function logout(refreshTokenRaw) {
  const tokenHash = hashToken(refreshTokenRaw);
  await RefreshToken.updateMany({ tokenHash, revokedAt: null }, { $set: { revokedAt: new Date() } });
  return { loggedOut: true };
}

async function createSession(user, config) {
  const tokenPayload = {
    sub: user._id.toString(),
    role: user.role,
    email: user.email,
  };

  const accessToken = signAccessToken(tokenPayload, config);
  const refreshToken = signRefreshToken(tokenPayload, config);

  const decoded = verifyRefreshToken(refreshToken, config);
  await RefreshToken.create({
    userId: user._id,
    tokenHash: hashToken(refreshToken),
    expiresAt: new Date(decoded.exp * 1000),
  });

  return {
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
    accessToken,
    refreshToken,
  };
}

module.exports = {
  register,
  login,
  refresh,
  logout,
};