/* ============================================================================
   PET MANAGER - Mensajes
============================================================================ */
function mostrarMensaje(texto, tipo = "success") {
    const box = document.getElementById("info-message");
    box.innerHTML = texto;
    box.className = "info-message show " + tipo;
    setTimeout(() => box.classList.remove("show"), 4000);
}

/* ============================================================================
   Cerrar todo
============================================================================ */
function cerrarTodo() {
    // Oculta todos los formularios del dashboard
    document.querySelectorAll(".formulario")
        .forEach(f => f.classList.add("oculto"));

    // Muestra el área de tarjetas (útil al volver a Pets)
    const tarjetas = document.getElementById("zona-tarjetas");
    if (tarjetas) tarjetas.style.display = "grid";

    // Reactiva el botón "Ver más"
    const btn = document.getElementById("botonVerMas");
    if (btn) btn.style.display = "block";

    // Oculta el hero (solo cuando estás dentro de un módulo)
    const hero = document.getElementById("hero-pet");
    if (hero) hero.style.display = "none";
}

/* ============================================================================
   PET MANAGER CLASS
============================================================================ */
class PetManager {

    constructor() {
        this.baseUrl = "https://petstore3.swagger.io/api/v3/pet";

        this.todas = [];
        this.visibles = [];
        this.LIMITE = 12;
        this.indice = 0;
        this.confirmandoEliminar = null;
        this.zona = document.getElementById("zona-tarjetas");
        this.btnVerMas = document.getElementById("botonVerMas");

        this.editID = null;
        this.timerEliminar = null;
        this.introMostrada = false;
        this.modo = "pets";
    }

    /* ============================================================================
       ✅ fetchApi CORREGIDO PARA PETSTORE v3
============================================================================ */
    async fetchApi(url, opciones = {}) {
        try {
            const response = await fetch(url, {
                method: opciones.method || "GET",
                headers: {
                    "Accept": "application/json",
                    ...(opciones.body ? { "Content-Type": "application/json" } : {})
                },
                body: opciones.body || null
            });

            const text = await response.text();
            try { return JSON.parse(text); }
            catch { return null; }

        } catch (err) {
            console.error("ERROR FETCH:", err);
            return null;
        }
    }

    /* ============================================================================
       CARGA INICIAL
============================================================================ */
    async iniciar() {

    const estados = ["available", "pending", "sold"];
    let todasMascotas = [];

    try {
        for (const estado of estados) {
            const data = await this.fetchApi(
                `${this.baseUrl}/findByStatus?status=${estado}`
            );

            if (Array.isArray(data)) {
                todasMascotas = todasMascotas.concat(
                    data.filter(p => p?.name)
                );
            }
        }

        // TODAS las mascotas (para búsquedas)
        this.todas = todasMascotas;

        // SOLO disponibles para la portada
        const disponibles = this.todas.filter(p => p.status === "available");

        this.visibles = disponibles.slice(0, this.LIMITE);
        this.indice = this.visibles.length;

        this.pintarTarjetas();
        this.actualizarBoton();

        // intro solo la primera vez
        if (!this.introMostrada) {
            document.getElementById("intro-pets").classList.remove("oculto");
            this.introMostrada = true;
        }

    } catch {
        mostrarMensaje("Error cargando mascotas", "error");
    }
}

    /* ============================================================================
       TARJETAS (con fotos seguras)
============================================================================ */
    pintarTarjetas(lista = this.visibles) {

        this.zona.innerHTML = lista.map(pet => {

            const inicial = pet.name?.[0]?.toUpperCase() || "?";

            const foto = pet.photoUrls?.[0];
            const esValida = foto && (foto.startsWith("http://") || foto.startsWith("https://"));

            const avatar = esValida
                ? `<img src="${foto}" class="foto-pet">`
                : `<div class="avatar-mascota">${inicial}</div>`;

            return `
                <div class="tarjeta-mascota" onclick="manager.mostrarDetalle(${pet.id})">

                    <div class="acciones-superiores" onclick="event.stopPropagation()">
                        <span class="icono-editar" onclick="manager.abrirEditor(event, ${pet.id})">✏️</span>
                        <span class="icono-borrar" onclick="manager.eliminarMascota(event, ${pet.id})">🗑️</span>
                    </div>

                    ${avatar}
                    <div class="nombre-mascota">${pet.name}</div>
                    <div class="estado-mascota"><strong>${pet.status}</strong></div>

                </div>
            `;
        }).join("");
    }

    /* ============================================================================
       CREAR / EDITAR MASCOTA
============================================================================ */
    async crearNuevaMascota() {

        const name = document.getElementById("add-name").value.trim();
        const status = document.getElementById("add-status").value;

        const categoryId = document.getElementById("add-category-id").value.trim();
        const categoryName = document.getElementById("add-category-name").value.trim();
        const photoUrl = document.getElementById("add-photo").value.trim();
        const tagsTxt = document.getElementById("add-tags").value.trim();
       
        if (!name) {
        mostrarMensaje(
            "No se puede crear la mascota: el nombre es obligatorio",
            "error"
        );
        return;
    }


    if (/^\d+$/.test(name)) {
        mostrarMensaje(
            "No se puede crear la mascota: el nombre no puede ser solo números",
            "error"
        );
        return;
    }

    // letras obligatorias, números permitidos
    const nameRegex = /^(?=.*[a-zA-ZáéíóúÁÉÍÓÚñÑ])[a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s]+$/;

    if (!nameRegex.test(name)) {
        mostrarMensaje(
            "No se puede crear la mascota: el nombre contiene caracteres no válidos",
            "error"
        );
        return;
    }

    
    if (categoryId && !/^\d+$/.test(categoryId)) {
        mostrarMensaje(
            "No se puede crear la mascota: el ID de la categoría debe contener solo números",
            "error"
        );
        return;
    }

    // ✅ VALIDACIÓN NOMBRE DE CATEGORÍA
// Si se rellena, solo puede contener letras y espacios
if (categoryName && !/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(categoryName)) {
    mostrarMensaje(
        "No se puede crear la mascota: el nombre de la categoría solo puede contener letras",
        "error"
    );
    return;
}



        const category = (categoryId || categoryName)
            ? { id: categoryId ? Number(categoryId) : 0, name: categoryName || "default" }
            : null;

        const tags = tagsTxt
            ? tagsTxt.split(",").map(t => ({ id: 0, name: t.trim() }))
            : [];

        /* ✅ MODO EDITAR */
        if (this.editID !== null) {
            const pet = this.todas.find(p => p.id === this.editID);
            if (pet) {
                pet.name = name;
                pet.status = status;
                pet.category = category;
                pet.photoUrls = photoUrl ? [photoUrl] : [];
                pet.tags = tags;
            }

            this.editID = null;
            this.pintarTarjetas();
            mostrarMensaje("Mascota editada correctamente", "success");
            cerrarTodo();
            return;
        }

        /*  MODO CREAR */
        const nuevaMascota = {
            id: Math.floor(Math.random() * 100000),
            name,
            status,
            category,
            photoUrls: photoUrl ? [photoUrl] : [],
            tags
        };

        await this.fetchApi(this.baseUrl, {
            method: "POST",
            body: JSON.stringify(nuevaMascota)
        });

        this.todas.unshift(nuevaMascota);
        this.visibles.unshift(nuevaMascota);

        this.pintarTarjetas();

        mostrarMensaje(`¡Mascota creada correctamente! — ID: ${nuevaMascota.id}`, "success");
        cerrarTodo();
    }

    /* ============================================================================
       ABRIR EDITOR (✏️)
============================================================================ */
    abrirEditor(event, id) {
    event.stopPropagation();

    const pet = this.todas.find(p => p.id === id);
    if (!pet) return;

    // mostramos el formulario (esto lo resetea)
    this.mostrarFormulario("form-add");

    // cambiamos a modo edición
    document.getElementById("titulo-form-mascota").textContent = "Editar mascota";
    document.getElementById("btn-add-mascota").textContent = "Guardar cambios";

    // Rellenar datos
    document.getElementById("add-name").value = pet.name;
    document.getElementById("add-status").value = pet.status;
    document.getElementById("add-category-id").value = pet.category?.id || "";
    document.getElementById("add-category-name").value = pet.category?.name || "";
    document.getElementById("add-photo").value = pet.photoUrls?.[0] || "";
    document.getElementById("add-tags").value = pet.tags?.map(t => t.name).join(", ") || "";

    this.editID = id;
}

    /* ============================================================================
       ELIMINAR MASCOTA (🗑️)
============================================================================ */
   eliminarMascota(event, id) {
    event.stopPropagation();

    const pet = this.todas.find(p => p.id === id);
    if (!pet) return;

    //  SEGUNDO CLIC → eliminación real
    if (this.confirmandoEliminar === id) {

        clearTimeout(this.timerEliminar);  // detener el temporizador
        this.confirmandoEliminar = null;

        this.todas = this.todas.filter(p => p.id !== id);
        this.visibles = this.visibles.filter(p => p.id !== id);
        localStorage.removeItem(`pet_${id}_status`);

        this.pintarTarjetas();
        mostrarMensaje(`Mascota "${pet.name}" eliminada correctamente ✅`, "success");
        return;
    }

    // ✅ PRIMER CLIC → pedir confirmación
    this.confirmandoEliminar = id;

    mostrarMensaje(
        `Vuelve a pulsar eliminar para confirmar la eliminación de "${pet.name}".`,
        "error"
    );

    //  Si el mensaje desaparece → cancelar la eliminación automáticamente
    clearTimeout(this.timerEliminar);
    this.timerEliminar = setTimeout(() => {

        // si no se confirmó antes
        if (this.confirmandoEliminar === id) {
            this.confirmandoEliminar = null;
            mostrarMensaje("Eliminación cancelada automáticamente ⏳", "error");
        }

    }, 12000);  
}


    /* ============================================================================
       DETALLE
============================================================================ */
    mostrarDetalle(id) {
        const pet = this.todas.find(p => p.id === id);
        if (!pet) return;

        mostrarMensaje(`
            <strong>${pet.name}</strong><br>
            ID: ${pet.id}<br>
            Estado: ${pet.status}<br>
            Etiquetas: ${pet.tags?.map(t => t.name).join(", ")}
        `, "success");
    }

    /* ============================================================================
       VER MÁS
============================================================================ */
    cargarMas() {

    let listaBase;

    if (this.modo === "adoptions") {
        // ✅ SOLO ADOPTADAS
        listaBase = this.todas.filter(p => p.status === "sold");
    } else {
        // ✅ SOLO DISPONIBLES
        listaBase = this.todas.filter(p => p.status === "available");
    }

    const siguiente = listaBase.slice(this.indice, this.indice + this.LIMITE);
    if (siguiente.length === 0) return;

    this.visibles = this.visibles.concat(siguiente);
    this.indice += siguiente.length;

    this.pintarTarjetas(this.visibles);

    // ✅ ocultar Ver más si ya no hay más
    this.btnVerMas.style.display =
        this.indice < listaBase.length ? "block" : "none";
}

    actualizarBoton() {
        this.btnVerMas.style.display =
            this.indice < this.todas.length ? "block" : "none";
    }

    /* ============================================================================
       MOSTRAR FORMULARIOS PET
============================================================================ */
   mostrarFormulario(id) {

    // ✅ Si abres el formulario de AÑADIR → resetearlo completamente
    if (id === "form-add") {
        // Reset título y botón
        document.getElementById("titulo-form-mascota").textContent = "Nueva mascota";
        document.getElementById("btn-add-mascota").textContent = "Crear mascota";

        // Reset del modo edición
        this.editID = null;

        // LIMPIAR TODOS LOS CAMPOS DEL FORMULARIO
        document.getElementById("add-name").value = "";
        document.getElementById("add-category-id").value = "";
        document.getElementById("add-category-name").value = "";
        document.getElementById("add-photo").value = "";
        document.getElementById("add-tags").value = "";
        document.getElementById("add-status").value = "available";  // por defecto
    }

    //  OCULTAR el mensaje introductorio al abrir cualquier formulario
    document.getElementById("intro-pets").classList.add("oculto");

    //  Ocultar zona de tarjetas y botón de ver más
    document.getElementById("zona-tarjetas").style.display = "none";
    document.getElementById("botonVerMas").style.display = "none";
    document.getElementById("hero-pet").style.display = "none";

    //  Ocultar TODOS los formularios primero
    document.querySelectorAll(".formulario")
        .forEach(f => f.classList.add("oculto"));

    // Mostrar el formulario seleccionado
    document.getElementById(id).classList.remove("oculto");
}

    /* ============================================================================
       MASCOTAS ADOPTADAS
============================================================================ */
    mostrarMascotasAdoptadas() {

    // 1️⃣ Obtener SOLO mascotas adoptadas
    const adoptadas = this.todas.filter(p => p.status === "sold");

    // 2️⃣ Si no hay adoptadas
    if (adoptadas.length === 0) {
        this.zona.innerHTML = "<p>No hay mascotas adoptadas.</p>";
        this.btnVerMas.style.display = "none";
        return;
    }

    // 3️⃣ Aplicar límite (12)
    this.visibles = adoptadas.slice(0, this.LIMITE);
    this.indice = this.visibles.length;

    // 4️⃣ Pintar tarjetas reutilizando el mismo método
    this.pintarTarjetas(this.visibles);

    // 5️⃣ Mostrar u ocultar "Ver más"
    this.btnVerMas.style.display =
        adoptadas.length > this.indice ? "block" : "none";
}

    /* ============================================================================
       BUSCAR MASCOTAS (ID + Nombre)
============================================================================ */
   async buscarMascotas() {

    const id = document.getElementById("search-id").value.trim();
    const nombre = document.getElementById("search-name").value.trim();

    // ✅ 1. Al menos uno debe estar informado
    if (!id && !nombre) {
        mostrarMensaje(
            "No se puede buscar: introduce un ID o un nombre",
            "error"
        );
        return;
    }

    // ✅ 2. ID: solo números
    if (id && !/^\d+$/.test(id)) {
        mostrarMensaje(
            "El ID debe contener solo números",
            "error"
        );
        return;
    }

    // ✅ 3. Nombre: no puede ser solo números (debe tener al menos una letra)
    if (nombre && !/[a-zA-ZáéíóúÁÉÍÓÚñÑ]/.test(nombre)) {
        mostrarMensaje(
            "El nombre debe contener al menos una letra",
            "error"
        );
        return;
    }

    // ───────── A PARTIR DE AQUÍ VA LA BÚSQUEDA REAL ─────────

    let resultados = [...this.todas];

    if (id) {
        resultados = resultados.filter(p => String(p.id) === id);
    }

    if (nombre) {
        const nombreLower = nombre.toLowerCase();
        resultados = resultados.filter(p =>
            p.name.toLowerCase().includes(nombreLower)
        );
    }

    if (resultados.length === 0) {
        this.ocultarIntro();
        document.getElementById("form-search").classList.add("oculto");

        this.zona.style.display = "grid";
        this.zona.innerHTML = "<p>No se encontraron mascotas.</p>";
        this.btnVerMas.style.display = "none";
        return;
    }

    this.ocultarIntro();
    document.getElementById("form-search").classList.add("oculto");

    this.zona.style.display = "grid";
    this.visibles = resultados;
    this.indice = resultados.length;

    this.pintarTarjetas(this.visibles);
    this.btnVerMas.style.display = "none";
}

    ocultarIntro() {
    const intro = document.getElementById("intro-pets");
    if (intro) intro.classList.add("oculto");
    }

    /* ============================================================================
       BUSQUEDA AVANZADA
============================================================================ */
    buscarAvanzado() {

    const estado = document.getElementById("search-status").value.trim();

    // ✅ Validación: debe elegir un estado
    if (!estado) {
        mostrarMensaje(
            "No se puede buscar: selecciona un estado",
            "error"
        );
        return;
    }

    // ✅ Filtrar por estado
    const resultados = this.todas.filter(p => p.status === estado);

    // ✅ Sin resultados
    if (resultados.length === 0) {
        this.ocultarIntro();
        document.getElementById("form-search-advanced").classList.add("oculto");

        this.zona.style.display = "grid";
        this.zona.innerHTML = "<p>No se encontraron mascotas.</p>";
        this.btnVerMas.style.display = "none";
        return;
    }

    // ✅ Mostrar resultados
    this.ocultarIntro();
    document.getElementById("form-search-advanced").classList.add("oculto");

    this.zona.style.display = "grid";
    this.visibles = resultados;
    this.indice = resultados.length;

    this.pintarTarjetas(this.visibles);

    // En búsqueda avanzada no hay paginación
    this.btnVerMas.style.display = "none";
}
    
}

/* ============================================================================
   INSTANCIA
============================================================================ */
const manager = new PetManager();
manager.iniciar();