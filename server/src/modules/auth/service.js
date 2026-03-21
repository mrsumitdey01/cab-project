const bcrypt = require('bcryptjs');
const { ApiError } = require('../../lib/errors');
const User = require('../../../models/User');
const RefreshToken = require('../../../models/RefreshToken');
const { hashToken, signAccessToken, signRefreshToken, verifyRefreshToken } = require('./tokens');

async function register(input, config) {
  // Check for duplicate email
  if (input.email) {
    const existingByEmail = await User.findOne({ email: input.email.toLowerCase() });
    if (existingByEmail) {
      throw new ApiError({
        status: 409,
        title: 'Conflict',
        detail: 'Email already registered.',
        code: 'email_exists',
      });
    }
  }

  // Check for duplicate phone
  if (input.phone) {
    const existingByPhone = await User.findOne({ phone: input.phone });
    if (existingByPhone) {
      throw new ApiError({
        status: 409,
        title: 'Conflict',
        detail: 'Phone number already registered.',
        code: 'phone_exists',
      });
    }
  }

  const passwordHash = await bcrypt.hash(input.password, config.bcryptRounds);

  const userData = {
    name: input.name,
    passwordHash,
    role: 'user',
  };
  if (input.email) userData.email = input.email.toLowerCase();
  if (input.phone) userData.phone = input.phone;

  const user = await User.create(userData);
  return createSession(user, config);
}

async function login(input, config) {
  const { identifier, password } = input;

  // Detect whether identifier is email (contains @) or phone
  const isEmail = identifier.includes('@');
  const query = isEmail
    ? { email: identifier.toLowerCase() }
    : { phone: identifier };

  const user = await User.findOne(query);
  if (!user) {
    throw new ApiError({ status: 401, title: 'Unauthorized', detail: 'Invalid credentials.', code: 'invalid_credentials' });
  }

  const validPassword = await bcrypt.compare(password, user.passwordHash);
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
  };
  if (user.email) tokenPayload.email = user.email;
  if (user.phone) tokenPayload.phone = user.phone;

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
      email: user.email || null,
      phone: user.phone || null,
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