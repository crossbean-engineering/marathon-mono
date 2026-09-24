import Joi from 'joi';

const phoneNumberSchema = Joi.string()
  .pattern(/^[1-9]\d{6,14}$/)
  .messages({
    'string.pattern.base': 'Phone number must be digits only without + prefix',
  });

export const sendOTPSchema = Joi.object({
  provider: Joi.string().valid('sms').required(),
  identifier: phoneNumberSchema.required(),
});
