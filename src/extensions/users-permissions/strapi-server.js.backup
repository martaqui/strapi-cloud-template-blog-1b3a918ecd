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

  // 📖📝 ULTRA-SIMPLE: Solo GET y PUT
  plugin.controllers.user.me = async (ctx) => {
    if (!ctx.state.user) {
      return ctx.unauthorized();
    }

    const userId = ctx.state.user.id;

    // 📖 GET: Leer con populate
    if (ctx.method === "GET") {
      try {
        const user = await strapi.entityService.findOne(
          "plugin::users-permissions.user",
          userId,
          { populate: ["datosFacturacion"] }
        );
        ctx.body = sanitizeOutput(user);
      } catch (error) {
        strapi.log.error("GET Error:", error.message);
        return ctx.badRequest("Error getting user");
      }
      return;
    }

    // 📝 PUT: Actualizar
    if (ctx.method === "PUT") {
      try {
        const updatedUser = await strapi.entityService.update(
          "plugin::users-permissions.user",
          userId,
          {
            data: ctx.request.body,
            populate: ["datosFacturacion"],
          }
        );
        ctx.body = sanitizeOutput(updatedUser);
      } catch (error) {
        strapi.log.error("PUT Error:", error.message);
        return ctx.badRequest(`Update error: ${error.message}`);
      }
      return;
    }

    // Otros métodos no soportados
    return ctx.methodNotAllowed();
  };

  // 🆔 AUTO-GENERACIÓN USERNAME
  const originalRegister = plugin.controllers.auth.register;

  plugin.controllers.auth.register = async (ctx) => {
    if (!ctx.request.body.username) {
      ctx.request.body.username = ctx.request.body.email.split("@")[0];
    }
    return await originalRegister(ctx);
  };

  return plugin;
};
