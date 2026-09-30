const bcrypt = require('bcryptjs');

const User = require('../Models/UserModel');
const { AppError } = require('../Utils/appError');
const { signToken } = require('../Utils/jwt');

async function register(request, response, next) {
  try {
    const { name, email, password, phone } = request.body;
    const normalizedEmail = email.toLowerCase().trim();

    if (await User.exists({ email: normalizedEmail })) {
      throw new AppError(409, 'An account with this email already exists');
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({ name: name.trim(), email: normalizedEmail, passwordHash, phone: phone.trim() });
    const token = signToken({ userId: user.id, email: user.email, role: user.role });

    return response.status(201).json({
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
  } catch (error) {
    return next(error);
  }
}

async function login(request, response, next) {
  try {
    const { email, password } = request.body;
    if (!email || !password) {
      throw new AppError(400, 'email and password are required');
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+passwordHash');
    if (!user || !(await user.comparePassword(password))) {
      throw new AppError(401, 'Invalid email or password');
    }

    const token = signToken({ userId: user.id, email: user.email, role: user.role });
    return response.json({
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = { register, login };
