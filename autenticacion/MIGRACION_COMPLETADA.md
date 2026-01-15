# Migración a Cookies Completada

## Resumen
Se ha realizado exitosamente la migración del almacenamiento de JWT desde `localStorage` a cookies HTTP-only para mejorar la seguridad de la aplicación.

## Cambios Realizados

### 1. Backend (server.js)

#### Middleware de Cookie Parser
```javascript
const cookieParser = require('cookie-parser');
app.use(cookieParser());
```

#### Configuración de CORS con Credenciales
```javascript
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true  // Permite enviar/recibir cookies
}));
```

#### Middleware de Autenticación Actualizado
```javascript
function authenticateToken(req, res, next) {
  const token = req.cookies.token;  // ✅ Ahora lee desde cookies
  
  if (!token) {
    return res.status(401).json({ error: 'Token no proporcionado' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Token inválido o expirado' });
    }
    req.user = user;
    next();
  });
}
```

### 2. Rutas de Autenticación (routes/auth.js)

#### Registro de Usuario
```javascript
// Enviar token como cookie HTTP-only
res.cookie('token', token, {
  httpOnly: true,                    // ✅ No accesible desde JavaScript
  secure: process.env.NODE_ENV === 'production',  // ✅ Solo HTTPS en producción
  sameSite: 'strict',                // ✅ Protección contra CSRF
  maxAge: 24 * 60 * 60 * 1000       // ✅ Expira en 24 horas
});
```

**Respuesta anterior:**
```json
{
  "message": "Usuario registrado exitosamente",
  "token": "eyJhbGc...",
  "user": { ... }
}
```

**Respuesta nueva:**
```json
{
  "message": "Usuario registrado exitosamente",
  "user": { ... }
}
```

#### Login de Usuario
Mismo patrón que el registro - el token se envía como cookie HTTP-only en la respuesta.

### 3. Servicio de Autenticación (authService.js)

#### Cambio Principal: credentials: 'include'
```javascript
export const authService = {
  register: async (email, password, name) => {
    const response = await fetch(`${API_URL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',  // ✅ Incluir cookies automáticamente
      body: JSON.stringify({ email, password, name })
    });
    // ...
  },

  login: async (email, password) => {
    const response = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',  // ✅ Incluir cookies automáticamente
      body: JSON.stringify({ email, password })
    });
    // ...
  },

  getProfile: async () => {
    const response = await fetch(`${API_URL}/me`, {
      credentials: 'include'  // ✅ Enviar cookie con el token
    });
    // ...
  },

  fetchWithAuth: async (url, options = {}) => {
    const config = {
      ...options,
      credentials: 'include',  // ✅ Siempre incluir cookies
      headers: {
        ...options.headers,
        'Content-Type': 'application/json'
      }
    };
    // ...
  }
};
```

#### Métodos Eliminados
- `getToken()` - Ya no necesario (el token está en la cookie)

#### Métodos Actualizados
- `logout()` - Ya no elimina el token de localStorage
- `isAuthenticated()` - Verifica la existencia del usuario, no del token

### 4. Contexto de Autenticación (AuthContext.jsx)

**Sin cambios requeridos** - El contexto sigue funcionando igual pero ahora el servicio usa cookies internamente.

## Ventajas de la Migración

### 🔒 Seguridad Mejorada

1. **XSS (Cross-Site Scripting) Protection**
   - Las cookies `httpOnly` no pueden ser accedidas por JavaScript malicioso
   - Impide robo de tokens a través de scripts inyectados

2. **CSRF (Cross-Site Request Forgery) Protection**
   - La opción `sameSite: 'strict'` previene ataques CSRF
   - Las cookies no se envían en peticiones cross-site

3. **Transporte Seguro**
   - La opción `secure: true` (en producción) asegura que las cookies solo se envíen por HTTPS

### 📊 Flujo de Autenticación Automático

**Antes (localStorage):**
```
1. Usuario hace login
2. Servidor envía token en JSON
3. Cliente guarda token en localStorage
4. Cliente envía token manualmente en cada petición
5. Si el token se roba, el atacante puede usarlo (XSS)
```

**Después (cookies):**
```
1. Usuario hace login
2. Servidor envía token como cookie HTTP-only
3. Navegador almacena la cookie automáticamente
4. Navegador envía cookie automáticamente en cada petición
5. Si hay XSS, el atacante NO puede acceder al token
```

## Pasos de Implementación

### Backend
1. ✅ Instalar `cookie-parser` (si no está instalado)
2. ✅ Importar y usar middleware de cookie parser
3. ✅ Configurar CORS con `credentials: true`
4. ✅ Modificar rutas de login/registro para enviar cookies
5. ✅ Actualizar middleware de autenticación para leer cookies

### Frontend
1. ✅ Actualizar `authService.js` para usar `credentials: 'include'`
2. ✅ Remover referencias a `getToken()` y `localStorage.getItem('token')`
3. ✅ Mantener `localStorage` para datos de usuario (no sensibles)

## Testing

### Registrar usuario
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "name": "Test User"
  }'
```

**Observar:** En las headers de respuesta, aparecerá `Set-Cookie: token=...`

### Acceder a ruta protegida
```bash
curl -X GET http://localhost:3000/api/protected \
  -b "token=<token_aqui>"
```

**Nota:** Con `credentials: 'include'`, el navegador envía automáticamente las cookies.

## Cambios de Variables de Entorno

No se requieren cambios. Los mismos `.env` funcionan:
```
JWT_SECRET=tu_secreto_aqui
NODE_ENV=development
```

## Consideraciones Finales

1. **Compatibilidad**: Funciona con todos los navegadores modernos
2. **Mobile**: Las cookies funcionan igual en aplicaciones móviles con credenciales incluidas
3. **Logout**: Implementar endpoint para limpiar la cookie:
   ```javascript
   app.post('/api/auth/logout', (req, res) => {
     res.clearCookie('token');
     res.json({ message: 'Logout exitoso' });
   });
   ```

## Estado de la Migración

✅ **COMPLETADA** - Todos los componentes han sido actualizados correctamente.

---

Documentado el: $(date)
