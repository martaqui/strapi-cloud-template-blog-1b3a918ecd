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

  // 📖📝 EXTENDER user.me para GET y PUT
  const originalMe = plugin.controllers.user.me;

  plugin.controllers.user.me = async (ctx) => {
    if (!ctx.state.user) {
      return ctx.unauthorized();
    }

    // 📖 GET: Usar lógica original con populate
    if (ctx.method === "GET") {
      const user = await strapi.entityService.findOne(
        "plugin::users-permissions.user",
        ctx.state.user.id,
        { populate: ["datosFacturacion"] }
      );
      ctx.body = sanitizeOutput(user);
      return;
    }

    // 📝 PUT: Lógica simple para actualización
    if (ctx.method === "PUT") {
      try {
        const userId = ctx.state.user.id;
        const updateData = ctx.request.body;

        // Actualización directa sin lógica compleja
        const updatedUser = await strapi.entityService.update(
          "plugin::users-permissions.user",
          userId,
          {
            data: updateData,
            populate: ["datosFacturacion"],
          }
        );

        ctx.body = sanitizeOutput(updatedUser);
        return;
      } catch (error) {
        strapi.log.error("Error updating user:", error.message);
        return ctx.badRequest(`Update failed: ${error.message}`);
      }
    }

    // Otros métodos: usar comportamiento original
    return originalMe(ctx);
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
