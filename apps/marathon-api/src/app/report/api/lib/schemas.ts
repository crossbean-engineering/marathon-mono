import Joi from 'joi';

export const statsQuerySchema = Joi.object({
  type: Joi.string()
    .valid('user_stats', 'participant_stats', 'wristband_stats', 'financial_stats')
    .required(),
});

export const reportQuerySchema = Joi.object({
  reportType: Joi.string().valid('package_performance').required(),
});
