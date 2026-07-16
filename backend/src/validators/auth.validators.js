'use strict';

const Joi = require('joi');

/**
 * Schema for user registration.
 * Validates: name (1–100 chars), valid email, password (min 8 chars), role enum.
 * Requirements: 1.3, 1.4, 1.5
 */
const registerSchema = Joi.object({
  name: Joi.string().min(1).max(100).required().messages({
    'string.base': 'Name must be a string',
    'string.empty': 'Name is required',
    'string.min': 'Name must be at least 1 character',
    'string.max': 'Name must be at most 100 characters',
    'any.required': 'Name is required',
  }),

  email: Joi.string().email().required().messages({
    'string.base': 'Email must be a string',
    'string.empty': 'Email is required',
    'string.email': 'Email must be a valid email address',
    'any.required': 'Email is required',
  }),

  password: Joi.string().min(8).required().messages({
    'string.base': 'Password must be a string',
    'string.empty': 'Password is required',
    'string.min': 'Password must be at least 8 characters',
    'any.required': 'Password is required',
  }),

  role: Joi.string().valid('admin', 'staff', 'student').required().messages({
    'string.base': 'Role must be a string',
    'any.only': 'Role must be one of: admin, staff, student',
    'any.required': 'Role is required',
  }),
}).options({ abortEarly: false });

/**
 * Schema for user login.
 * Validates: valid email, non-empty password (no min-length enforcement on login).
 * Requirements: 2.6, 2.7
 */
const loginSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.base': 'Email must be a string',
    'string.empty': 'Email is required',
    'string.email': 'Email must be a valid email address',
    'any.required': 'Email is required',
  }),

  password: Joi.string().min(1).required().messages({
    'string.base': 'Password must be a string',
    'string.empty': 'Password is required',
    'any.required': 'Password is required',
  }),
}).options({ abortEarly: false });

module.exports = { registerSchema, loginSchema };
