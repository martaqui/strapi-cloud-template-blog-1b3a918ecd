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

  // 📖📝 LECTURA Y ESCRITURA: Modificar user.me para manejar GET y PUT
  plugin.controllers.user.me = async (ctx) => {
    if (!ctx.state.user) {
      return ctx.unauthorized();
    }

    const userId = ctx.state.user.id;

    // 📖 GET: Devolver datos del usuario con datosFacturacion
    if (ctx.method === "GET") {
      const user = await strapi.entityService.findOne(
        "plugin::users-permissions.user",
        userId,
        { populate: ["datosFacturacion"] }
      );
      ctx.body = sanitizeOutput(user);
      return;
    }

    // 📝 PUT: Actualizar datos del usuario y datosFacturacion
    if (ctx.method === "PUT") {
      try {
        const { datosFacturacion, ...otherFields } = ctx.request.body;

        // Preparar datos para actualización
        const updateData = { ...otherFields };

        // Si hay datosFacturacion, agregarlo al updateData
        if (datosFacturacion) {
          updateData.datosFacturacion = datosFacturacion;
        }

        // Actualizar usuario
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
        strapi.log.error("Error updating user profile:", error);
        return ctx.badRequest("Error updating user profile");
      }
    }

    // Método no permitido
    return ctx.methodNotAllowed();
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
