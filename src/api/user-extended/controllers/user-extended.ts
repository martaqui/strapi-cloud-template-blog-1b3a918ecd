export default ({ strapi }) => ({
  async update(ctx) {
    try {
      const { id } = ctx.params;
      const data = ctx.request.body;

      // Verificar si el usuario tiene permiso para actualizar
      const user = ctx.state.user;
      if (!user) {
        return ctx.unauthorized("No estás autorizado");
      }

      // Si el ID es 'me', usar el ID del usuario actual
      const userId = id === "me" ? user.id : id;

      // Verificar que el usuario solo pueda actualizar su propio perfil
      if (user.id !== parseInt(userId)) {
        return ctx.unauthorized("No puedes modificar otros usuarios");
      }

      // Usar entityService para actualizar el usuario
      const updatedUser = await strapi.entityService.update(
        "plugin::users-permissions.user",
        userId,
        {
          data,
          populate: ["datosFacturacion"],
        }
      );

      // Eliminar campos sensibles
      delete updatedUser.password;
      delete updatedUser.resetPasswordToken;
      delete updatedUser.confirmationToken;

      return updatedUser;
    } catch (err) {
      strapi.log.error(err);
      return ctx.throw(500, err);
    }
  },
});
