"use strict";

/**
 * pedido controller
 */

const { createCoreController } = require("@strapi/strapi").factories;

module.exports = createCoreController("api::pedido.pedido", ({ strapi }) => ({
  async create(ctx) {
    // Obtener el usuario autenticado
    const user = ctx.state.user;

    if (!user) {
      return ctx.unauthorized("Usuario no autenticado");
    }

    // Generar número de pedido único
    const fecha = new Date();
    const year = fecha.getFullYear();
    const month = String(fecha.getMonth() + 1).padStart(2, "0");
    const day = String(fecha.getDate()).padStart(2, "0");

    // Contar pedidos del día para generar número secuencial
    const pedidosHoy = await strapi.entityService.findMany(
      "api::pedido.pedido",
      {
        filters: {
          fecha_pedido: {
            $gte: new Date(
              year,
              fecha.getMonth(),
              fecha.getDate()
            ).toISOString(),
            $lt: new Date(
              year,
              fecha.getMonth(),
              fecha.getDate() + 1
            ).toISOString(),
          },
        },
      }
    );

    const numeroSecuencial = String(pedidosHoy.length + 1).padStart(3, "0");
    const numeroPedido = `ORD-${year}${month}${day}-${numeroSecuencial}`;

    // Preparar datos del pedido
    const pedidoData = {
      ...ctx.request.body.data,
      numero_pedido: numeroPedido,
      user: user.id,
      fecha_pedido: fecha.toISOString(),
      estado: "pendiente",
      historial_estados: [
        {
          estado: "pendiente",
          fecha: fecha.toISOString(),
          comentario: "Pedido recibido",
        },
      ],
    };

    // Calcular totales si no se proporcionan
    if (pedidoData.casos && !pedidoData.total) {
      const subtotal = pedidoData.casos.reduce(
        (sum, caso) => sum + (caso.subtotal || 0),
        0
      );
      pedidoData.subtotal = subtotal;
      pedidoData.total = subtotal - (pedidoData.descuento || 0);
    }

    // Asignar los datos al contexto
    ctx.request.body.data = pedidoData;

    // Llamar al método create original
    const response = await super.create(ctx);

    return response;
  },

  async find(ctx) {
    // Si el usuario está autenticado, filtrar por sus pedidos
    const user = ctx.state.user;

    if (user) {
      // Crear un nuevo objeto de filtros
      const filters =
        ctx.query.filters && typeof ctx.query.filters === "object"
          ? { ...ctx.query.filters }
          : {};
      filters.user = user.id;
      ctx.query.filters = filters;
    }

    // Ordenar por fecha de pedido (más recientes primero)
    if (!ctx.query.sort) {
      ctx.query.sort = "fecha_pedido:desc";
    }

    // Llamar al método find original
    const response = await super.find(ctx);

    return response;
  },

  // VERSIÓN TEMPORAL SIMPLIFICADA PARA DIAGNÓSTICO
  async findOne(ctx) {
    console.log("🔍 findOne llamado con ID:", ctx.params.id);
    console.log("🔍 Usuario autenticado:", ctx.state.user?.id);

    // Verificar autenticación
    const user = ctx.state.user;
    if (!user) {
      console.log("❌ Usuario no autenticado");
      return ctx.unauthorized("Usuario no autenticado");
    }

    try {
      // Usar directamente entityService para diagnosticar
      const pedido = await strapi.entityService.findOne(
        "api::pedido.pedido",
        ctx.params.id,
        {
          populate: ["user"],
        }
      );

      console.log("🔍 Pedido encontrado:", pedido ? "SÍ" : "NO");
      if (pedido) {
        console.log("🔍 Pedido user ID:", pedido.user?.id);
        console.log("🔍 Usuario autenticado ID:", user.id);
      }

      if (!pedido) {
        console.log("❌ Pedido no encontrado en entityService");
        return ctx.notFound("Pedido no encontrado");
      }

      // Verificar que el pedido pertenece al usuario
      if (pedido.user && pedido.user.id !== user.id) {
        console.log("❌ Pedido no pertenece al usuario");
        return ctx.forbidden("No tienes permisos para ver este pedido");
      }

      console.log("✅ Pedido encontrado y autorizado");
      return { data: pedido };
    } catch (error) {
      console.error("❌ Error en findOne:", error);
      return ctx.notFound("Pedido no encontrado");
    }
  },

  async update(ctx) {
    // Solo permitir actualizar el estado y notas
    const user = ctx.state.user;

    if (!user) {
      return ctx.unauthorized("Usuario no autenticado");
    }

    // Verificar que el pedido pertenece al usuario
    const pedidoId = ctx.params.id;
    const pedido = await strapi.entityService.findOne(
      "api::pedido.pedido",
      pedidoId
    );

    if (!pedido || (pedido.user && pedido.user.id !== user.id)) {
      return ctx.forbidden("No tienes permisos para modificar este pedido");
    }

    // Solo permitir actualizar ciertos campos
    const allowedFields = ["estado", "notas"];
    const updateData = {};

    allowedFields.forEach((field) => {
      if (ctx.request.body.data[field] !== undefined) {
        updateData[field] = ctx.request.body.data[field];
      }
    });

    // Si se actualiza el estado, agregar al historial
    if (updateData.estado && updateData.estado !== pedido.estado) {
      const historialActual = Array.isArray(pedido.historial_estados)
        ? pedido.historial_estados
        : [];
      historialActual.push({
        estado: updateData.estado,
        fecha: new Date().toISOString(),
        comentario: `Estado cambiado a ${updateData.estado}`,
      });
      updateData.historial_estados = historialActual;
    }

    ctx.request.body.data = updateData;

    // Llamar al método update original
    const response = await super.update(ctx);

    return response;
  },
}));
