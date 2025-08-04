"use strict";

module.exports = (plugin) => {
  const sanitizeOutput = (user) => {
    const {
      password,
      resetPasswordToken,
      confirmationToken,
      ...sanitizedUser
    } = user;
    return sanitizedUser;
  };

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

  // Guardar el método register original
  const originalRegister = plugin.controllers.auth.register;

  plugin.controllers.auth.register = async (ctx) => {
    // Asegurar que username existe
    if (!ctx.request.body.username) {
      ctx.request.body.username = ctx.request.body.email.split("@")[0];
    }

    // Llamar al método original
    return await originalRegister(ctx);
  };

  return plugin;
};
