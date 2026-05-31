/* ============================================================================
   USER MANAGER
   Controla toda la lógica del módulo "User", incluyendo:
     - Crear usuario individual
     - Crear lista de usuarios
     - Login y logout
     - Buscar usuario por username
     - Editar usuario (email o datos completos)
     - Eliminar usuario
   Utiliza la API oficial Swagger PetStore.
============================================================================ */

class UserManager {

    constructor() {

        /* URL base para todas las operaciones del módulo User */
        this.baseUrl = "https://petstore3.swagger.io/api/v3/user";

        /* Contenedores HTML donde se muestran resultados */
        this.resLogin = document.getElementById("user-login-result");
        this.resFindUser = document.getElementById("user-find-result");
    }



    /* ============================================================================
       MÉTODO GENÉRICO FETCH
       Realiza una petición HTTP y devuelve JSON seguro.
       - Si el JSON está vacío, devuelve null.
       - Si la API falla, lanza error.
    ============================================================================ */
    async fetchApi(url, opciones = {}) {
        try {
            const response = await fetch(url, opciones);

            try {
                return await response.json();   /* Intentamos extraer JSON */
            } catch {
                return null;                   /* API devolvió vacío o texto */
            }

        } catch (err) {
            console.error("ERROR FETCH USER:", err);
            alert("Error comunicando con la API de usuario");
            throw err;
        }
    }



    /* ============================================================================
       MOSTRAR FORMULARIO DENTRO DEL MÓDULO USER
       - Oculta panel principal
       - Oculta todos los formularios del módulo
       - Muestra el formulario solicitado
    ============================================================================ */
    showForm(id) {

        /* Ocultar panel principal */
        document.getElementById("user-panel").classList.add("oculto");

        /* Ocultar todos los formularios del módulo User */
        document
            .querySelectorAll("#module-user .formulario")
            .forEach(f => f.classList.add("oculto"));

        /* Mostrar panel principal o el formulario indicado */
        if (id === "user-panel") {
            document.getElementById("user-panel").classList.remove("oculto");
        } else {
            document.getElementById(id).classList.remove("oculto");
        }

        /* Ocultar tarjetas del módulo Pets cuando entramos en User */
        document.getElementById("zona-tarjetas").style.display = "none";
    }



    /* ============================================================================
       POST /user
       Crear un usuario individual.
       La API requiere:
         - username
         - email
         - y opcionalmente: nombre, apellido, password, teléfono
    ============================================================================ */
    async createUser() {

        /* Captura de datos del formulario */
        const username = document.getElementById("user-create-username")?.value.trim();
        const firstName = document.getElementById("user-create-fname")?.value.trim();
        const lastName = document.getElementById("user-create-lname")?.value.trim();
        const email = document.getElementById("user-create-email")?.value.trim();
        const password = document.getElementById("user-create-password")?.value.trim();
        const phone = document.getElementById("user-create-phone")?.value.trim();

        /* Validación mínima */
        if (!username || !email) {
            alert("Username y email son obligatorios");
            return;
        }

        /* Objeto enviado a la API */
        const userData = {
            id: Math.floor(Math.random() * 100000),  /* ID generado localmente */
            username,
            firstName,
            lastName,
            email,
            password,
            phone,
            userStatus: 1                              /* Estado estándar */
        };

        try {
            /* Enviar al API */
            await this.fetchApi(this.baseUrl, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(userData)
            });

            alert("Usuario creado correctamente");
            this.showForm("user-panel");

        } catch (err) {
            console.error("Error creando usuario:", err);
            alert("Error al crear usuario");
        }
    }



    /* ============================================================================
       POST /user/createWithList
       Permite enviar un array JSON de usuarios.
    ============================================================================ */
    async createUserList() {

        const rawJson = document.getElementById("user-list-json").value.trim();

        if (!rawJson) {
            alert("Introduce un JSON válido");
            return;
        }

        let lista;

        /* Validación: el JSON debe tener formato correcto */
        try {
            lista = JSON.parse(rawJson);
        } catch {
            alert("El JSON no tiene formato válido");
            return;
        }

        /* Enviar lista */
        await this.fetchApi(`${this.baseUrl}/createWithList`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(lista)
        });

        alert("Lista enviada correctamente");
    }



    /* ============================================================================
       GET /user/login
       Realiza login simple basado en username y password en URL.
    ============================================================================ */
    async login() {

        const username = document.getElementById("user-login-name").value.trim();
        const pass = document.getElementById("user-login-pass").value.trim();

        if (!username || !pass) {
            alert("Rellena usuario y contraseña");
            return;
        }

        const url = `${this.baseUrl}/login?username=${username}&password=${pass}`;

        const data = await this.fetchApi(url);

        /* Pintar respuesta en el panel de login */
        this.resLogin.innerHTML = `
            <p><strong>Message:</strong> ${data.message}</p>
            <p><strong>Code:</strong> ${data.code}</p>
        `;
    }



    /* ============================================================================
       GET /user/logout
       Termina la sesión actual (según API Swagger)
    ============================================================================ */
    async logout() {
        const url = `${this.baseUrl}/logout`;
        await this.fetchApi(url);

        alert("Sesión cerrada");
    }



    /* ============================================================================
       GET /user/{username}
       Buscar usuario por username
    ============================================================================ */
    async findUser() {

        const username = document.getElementById("user-find-name").value.trim();

        if (!username) {
            alert("Introduce un username");
            return;
        }

        try {
            /* Consulta API */
            const url = `${this.baseUrl}/${username}`;
            const data = await this.fetchApi(url);

            /* Pintar datos de usuario */
            this.resFindUser.innerHTML = `
                <p><strong>ID:</strong> ${data.id}</p>
                <p><strong>Name:</strong> ${data.firstName} ${data.lastName}</p>
                <p><strong>Email:</strong> ${data.email}</p>
            `;

        } catch {
            /* Usuario no encontrado */
            this.resFindUser.innerHTML =
                `<p>User "${username}" does not exist</p>`;
        }
    }



    /* ============================================================================
       PUT /user/{username}
       Actualizar parcialmente un usuario (solo email aquí)
    ============================================================================ */
    async updateUser() {

        const username = document.getElementById("user-edit-name").value.trim();
        const newEmail = document.getElementById("user-edit-email").value.trim();

        if (!username || !newEmail) {
            alert("Indica username y nuevo email");
            return;
        }

        const datos = { email: newEmail };

        await this.fetchApi(`${this.baseUrl}/${username}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(datos)
        });

        alert("Usuario actualizado");
    }



    /* ============================================================================
       DELETE /user/{username}
       Elimina un usuario por username
    ============================================================================ */
    async deleteUser() {

        const username = document.getElementById("user-delete-name").value.trim();

        if (!username) {
            alert("Introduce un username");
            return;
        }

        if (!confirm("¿Seguro que deseas eliminar este usuario?")) return;

        await fetch(`${this.baseUrl}/${username}`, { method: "DELETE" });

        alert("Usuario eliminado");
    }



    /* ============================================================================
       CAMBIAR MODO DE EDICIÓN:
       - email solamente
       - edición completa
    ============================================================================ */
    switchEditMode(mode) {

        /* Ocultar ambos formularios */
        document.getElementById("edit-mode-email").classList.add("oculto");
        document.getElementById("edit-mode-full").classList.add("oculto");

        /* Mostrar el modo solicitado */
        if (mode === "email") {
            document.getElementById("edit-mode-email").classList.remove("oculto");
        } else {
            document.getElementById("edit-mode-full").classList.remove("oculto");
        }
    }



    /* ============================================================================
       Actualizar solo email del usuario
    ============================================================================ */
    async updateUserEmail() {

        const username = document.getElementById("user-edit-username").value.trim();
        const newEmail = document.getElementById("user-edit-email").value.trim();

        if (!username || !newEmail) {
            alert("Username y email son obligatorios");
            return;
        }

        /* Obtener usuario actual */
        const userData = await this.fetchApi(`${this.baseUrl}/${username}`);

        if (!userData) {
            alert("Usuario no encontrado");
            return;
        }

        /* Actualizar email */
        userData.email = newEmail;

        /* PUT del objeto completo */
        await this.fetchApi(`${this.baseUrl}/${username}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(userData)
        });

        alert("Email actualizado");
        this.showForm("user-panel");
    }



    /* ============================================================================
       Actualizar todos los datos del usuario
    ============================================================================ */
    async updateUserFull() {

        const username = document
            .getElementById("user-edit-full-username").value.trim();

        if (!username) {
            alert("Username obligatorio");
            return;
        }

        /* Construir objeto con datos actualizados */
        const userData = {
            username,
            firstName: document.getElementById("user-edit-full-fname").value.trim(),
            lastName: document.getElementById("user-edit-full-lname").value.trim(),
            email: document.getElementById("user-edit-full-email").value.trim(),
            password: document.getElementById("user-edit-full-password").value.trim(),
            phone: document.getElementById("user-edit-full-phone").value.trim(),
            userStatus: 1
        };

        /* PUT completo */
        await this.fetchApi(`${this.baseUrl}/${username}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(userData)
        });

        alert("Usuario actualizado");
        this.showForm("user-panel");
    }

}



/* ============================================================================
   INSTANCIA GLOBAL DEL MÓDULO USER
   Permite llamar user.metodo() desde HTML
============================================================================ */
const user = new UserManager();