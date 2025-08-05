"use strict";

module.exports = (plugin) => {
  // 🔒 Función para limpiar datos sensibles
  const sanitizeOutput = (user) => {
    const {
      password,
      resetPasswordToken,
      confirmationToken,
      ...sanitizedUser
    } = user;
    return sanitizedUser;
  };

  // 📖 SOLO LECTURA: Modificar user.me para popular datosFacturacion
  plugin.controllers.user.me = async (ctx) => {
    if (!ctx.state.user) {
      return ctx.unauthorized();
    }

    const user = await strapi.entityService.findOne(
      "plugin::users-permissions.user",
      ctx.state.user.id,
      { populate: ["datosFacturacion"] }
    );

    ctx.body = sanitizeOutput(user);
  };

  // 🆔 AUTO-GENERACIÓN USERNAME: Solo modificar register para username automático
  const originalRegister = plugin.controllers.auth.register;

  plugin.controllers.auth.register = async (ctx) => {
    // Si no hay username, generarlo del email
    if (!ctx.request.body.username) {
      ctx.request.body.username = ctx.request.body.email.split("@")[0];
    }

    // Llamar al método original sin modificaciones adicionales
    return await originalRegister(ctx);
  };

  return plugin;
};
