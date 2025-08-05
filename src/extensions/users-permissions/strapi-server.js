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

    // Si es PUT, actualizar datos
    if (ctx.request.method === "PUT") {
      try {
        // Para componentes, necesitamos usar un enfoque específico
        const updateData = { ...ctx.request.body };

        // Si estamos actualizando datosFacturacion, necesitamos el ID del componente existente
        if (updateData.datosFacturacion) {
          const currentUser = await strapi.entityService.findOne(
            "plugin::users-permissions.user",
            ctx.state.user.id,
            { populate: ["datosFacturacion"] }
          );

          // Si ya existe un componente datosFacturacion, incluir su ID
          if (currentUser.datosFacturacion) {
            updateData.datosFacturacion.id = currentUser.datosFacturacion.id;
          }
        }

        const updatedUser = await strapi.entityService.update(
          "plugin::users-permissions.user",
          ctx.state.user.id,
          {
            data: updateData,
            populate: ["datosFacturacion"],
          }
        );

        ctx.body = sanitizeOutput(updatedUser);
        return;
      } catch (err) {
        strapi.log.error("Error updating user:", err);
        return ctx.badRequest(err.message);
      }
    }

    // Si es GET, obtener datos (comportamiento original)
    const user = await strapi.entityService.findOne(
      "plugin::users-permissions.user",
      ctx.state.user.id,
      { populate: ["datosFacturacion"] }
    );

    ctx.body = sanitizeOutput(user);
  };

  // Agregar ruta PUT para /users/me
  plugin.routes["content-api"].routes.push({
    method: "PUT",
    path: "/users/me",
    handler: "user.me",
  });

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
