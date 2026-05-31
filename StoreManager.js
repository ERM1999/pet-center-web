/* ============================================================================
   STORE MANAGER
============================================================================ */

class StoreManager {

    constructor() {
        this.baseUrl = "https://petstore.swagger.io/v2/store";

        // Resultado del formulario unificado
        this.resManage = document.getElementById("order-manage-result");
        
this.confirmandoEliminar = null;
    this.timerEliminar = null;

    }

    async fetchApi(url, opciones = {}) {
        try {
            const response = await fetch(url, opciones);
            try { return await response.json(); }
            catch { return null; }
        } catch (err) {
            console.error("ERROR STORE FETCH:", err);
            mostrarMensaje("Error conectando con la API Store", "error");
            throw err;
        }
    }

    /* ============================================================================
       INVENTARIO
    ============================================================================ */
    async getInventory() {
        const data = await this.fetchApi(`${this.baseUrl}/inventory`);

        if (!data) {
            document.getElementById("inventory-result").innerHTML =
                "<p>Error leyendo el inventario</p>";
            return;
        }

        const html = Object.entries(data)
            .map(([status, qty]) =>
                `<p><strong>${status}:</strong> ${qty}</p>`
            )
            .join("");

        document.getElementById("inventory-result").innerHTML = html;
    }

    /* ============================================================================
       MOSTRAR FORMULARIO
    ============================================================================ */
    showForm(idFormulario) {

        document.querySelectorAll(".formulario")
            .forEach(f => f.classList.add("oculto"));

        document.getElementById(idFormulario).classList.remove("oculto");

        document.getElementById("zona-tarjetas").style.display = "none";
        document.getElementById("botonVerMas").style.display = "none";
    }


    /* ============================================================================
       CREAR PEDIDO
    ============================================================================ */
    async createOrder() {

        const petId = Number(document.getElementById("order-petId").value);
        const status = document.getElementById("order-status").value;
        const shipDateInput = document.getElementById("order-shipDate").value;

        if (!petId) {
            mostrarMensaje("Pet ID requerido", "error");
            return;
        }

        const order = {
            id: Math.floor(Math.random() * 100000),
            petId,
            quantity: 1,
            shipDate: shipDateInput
                ? new Date(shipDateInput).toISOString()
                : new Date().toISOString(),
            status,
            complete: status === "delivered"
        };

        await this.fetchApi(`${this.baseUrl}/order`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(order)
        });

        // Si implica adopción, actualizamos mascota
        if (status === "approved" || status === "delivered") {
            await manager.cambiarEstadoMascota?.(petId, "sold");
        }

        mostrarMensaje(`Pedido creado correctamente — ID: ${order.id}`, "success");

        cerrarTodo();
    }


    /* ============================================================================
       FORMULARIO UNIFICADO: BUSCAR + PREPARAR ACTUALIZACIÓN
    ============================================================================ */
    async findOrderForUpdate() {

        const id = document.getElementById("order-manage-id").value.trim();
        const updateSection = document.getElementById("order-update-section");

        this.resManage.textContent = "";
        updateSection.classList.add("oculto");

        if (!id) {
            this.resManage.textContent = "Introduce un ID válido.";
            return;
        }

        try {
            const order = await this.fetchApi(`${this.baseUrl}/order/${id}`);

            if (!order || order.code === 1) throw new Error("Pedido no encontrado");

            // Revisar si tiene estado guardado manualmente
            const guardado = localStorage.getItem(`order_${id}_status`);
            if (guardado) order.status = guardado;

            this._currentOrder = order;

            this.resManage.innerHTML = `
                <p><strong>ID:</strong> ${order.id}</p>
                <p><strong>ID Mascota:</strong> ${order.petId}</p>
                <p><strong>Cantidad:</strong> ${order.quantity}</p>
                <p><strong>Estado actual:</strong> ${order.status}</p>
            `;

            updateSection.classList.remove("oculto");

        } catch (error) {
            this.resManage.textContent = `❌ ${error.message}`;
        }
    }


    /* ============================================================================
       ELIMINAR PEDIDO
    ============================================================================ */
    async deleteOrder() {

    const id = document.getElementById("order-delete-id").value.trim();

    // ✅ Validaciones básicas
    if (!id) {
        mostrarMensaje("Introduce un ID de pedido", "error");
        return;
    }

    if (!/^\d+$/.test(id)) {
        mostrarMensaje("El ID del pedido debe ser numérico", "error");
        return;
    }

    // ✅ SEGUNDO CLIC → eliminar de verdad
    if (this.confirmandoEliminar === id) {

        clearTimeout(this.timerEliminar);
        this.confirmandoEliminar = null;

        const response = await fetch(
            `${this.baseUrl}/order/${id}`,
            { method: "DELETE" }
        );

        if (response.ok) {
            mostrarMensaje("Pedido eliminado correctamente ✅", "success");
            cerrarTodo();
        } else {
            mostrarMensaje(
                "No se ha podido eliminar el pedido (puede no existir)",
                "error"
            );
        }
        return;
    }

    // ✅ PRIMER CLIC → comprobar si existe
    const check = await fetch(`${this.baseUrl}/order/${id}`);

    if (!check.ok) {
        mostrarMensaje("El pedido no existe", "error");
        return;
    }

    // 🟡 pedir confirmación
    this.confirmandoEliminar = id;

    mostrarMensaje(
        `Vuelve a pulsar eliminar para confirmar la eliminación del pedido ${id}`,
        "error"
    );

    // ⏱️ cancelar si no confirma
    clearTimeout(this.timerEliminar);
    this.timerEliminar = setTimeout(() => {
        this.confirmandoEliminar = null;
        mostrarMensaje(
            "Eliminación del pedido cancelada automáticamente ⏳",
            "error"
        );
    }, 10000);
}
}

/* ============================================================================
   INSTANCIA
============================================================================ */
const store = new StoreManager();

/* ============================================================================
   ACTUALIZAR PEDIDO + ACTUALIZAR MASCOTA (manual)
============================================================================ */

store.updateOrderStatus = async function () {

    const newStatus = document.getElementById("order-update-status").value;

    if (!store._currentOrder) {
        store.resManage.textContent = "Busca un pedido antes de actualizar.";
        return;
    }

    const order = store._currentOrder;

    // Guardar nuevo estado localmente
    localStorage.setItem(`order_${order.id}_status`, newStatus);
    order.status = newStatus;

    store.resManage.innerHTML += `
        <p>✅ Estado del pedido actualizado a: <strong>${newStatus}</strong></p>
    `;

    // Si implica adopción: actualizar mascota
    if (newStatus === "approved" || newStatus === "delivered") {
        if (manager?.cambiarEstadoMascota) {
            await manager.cambiarEstadoMascota(order.petId, "sold");

            store.resManage.innerHTML += `
                <p>🐾 Mascota con ID <strong>${order.petId}</strong> ahora está <strong>adoptada</strong>.</p>
            `;
        }
    }

    mostrarMensaje("Pedido actualizado correctamente", "success");
};