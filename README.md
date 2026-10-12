# CCM FleetManager Mobile

App Android (React Native CLI) para gestionar la flota del Colegio CCM. Replica las pantallas del cliente web `apps/client` y consume la misma API de Express.

- Plataforma: **sólo Android**
- Backend: `https://ccm-fleetmanager.onrender.com`
- Auth: Supabase Auth (mismo proyecto que el web)
- React Native `0.76.5` · JavaScript

---

## 1. Requisitos previos

| Requisito | Notas |
|---|---|
| Node.js 18+ | `node -v` |
| JDK 17 | Requerido por Gradle de RN 0.76. `java -version` |
| Android Studio | Con SDK Platform 34+ y Android SDK Build-Tools |
| Variable `ANDROID_HOME` | Apunta a `...\Android\Sdk` |
| Dispositivo o emulador | Con depuración USB activa (verificar con `adb devices`) |

> En PowerShell usá `npm.cmd` si `npm.ps1` está bloqueado por política de ejecución.

---

## 2. Configurar credenciales

```powershell
cd "ruta\del\repositorio"
Copy-Item src\config.example.js src\config.js
```

Editá `src/config.js` con tus valores:

| Variable | Origen |
|---|---|
| `SUPABASE_URL` | Supabase → Project Settings → API → Project URL |
| `SUPABASE_PUBLISHABLE_KEY` | Supabase → Project Settings → API → `anon` / `publishable` key |
| `API_URL` | `https://ccm-fleetmanager.onrender.com` (o `http://10.0.2.2:4000` para probar contra un backend local desde el emulador Android) |

`src/config.js` está en `.gitignore`: no se sube a git. Sin ese archivo la app no arranca a propósito, para que nadie commitee credenciales.

---

## 3. Instalar y ejecutar

```powershell
npm.cmd install

# Terminal 1: Metro bundler
npm.cmd run start

# Terminal 2: compilar e instalar en el dispositivo/emulador conectado
npm.cmd run android
```

La primera compilación tarda varios minutos (Gradle descarga dependencias). La carpeta `android/` ya está incluida y lista.

---

## 4. Estructura del proyecto

```
CCM-FleetManager-Mobile/
├── android/                    # Proyecto nativo Gradle (RN 0.76.5)
├── index.js                    # Punto de entrada → src/App
├── app.json                    # name debe coincidir con android/ (CCMFleetMobile)
├── package.json
├── babel.config.js
├── metro.config.js
└── src/
    ├── App.jsx                 # Auth global, sesión, idle timeout
    ├── config.js               # Credenciales (creado desde config.example.js)
    ├── config.example.js       # Plantilla versionada
    ├── theme.js                # Paleta Arctic Blue + estilos compartidos
    ├── lib/
    │   ├── supabase.js         # Cliente con AsyncStorage
    │   ├── api.js              # Llamadas a la API (idéntico al web)
    │   └── useIdleTimeout.js   # Cierre de sesión por inactividad (1 hora)
    ├── components/             # Button, Card, Field, Select, Pill, Modal, cuenta
    ├── screens/
    │   ├── AuthScreen.jsx      # Login / registro / recuperar contraseña
    │   ├── ResetPasswordScreen.jsx
    │   ├── HomeScreen.jsx      # Header, pestañas, modal de kilometraje semanal
    │   ├── VehiculosScreen.jsx # Flota + catálogos + todos los modales
    │   └── CargaCombustibleScreen.jsx  # Individual + por flota
    └── utils/format.js         # Fechas, semanas ISO, formateo de números
```

---

## 5. Equivalencias con el cliente web

| Web | Móvil |
|---|---|
| `div`, `section` | `View` |
| `button` | `TouchableOpacity` |
| `input`, `select` | `TextInput` + `Select` (modal con lista) |
| `<input type="date">` | `TextInput` con formato `AAAA-MM-DD` |
| Modal con backdrop | `Modal` nativo (`transparent`) |
| Tailwind (`bg-arctic`, …) | `StyleSheet` + `src/theme.js` |
| `import.meta.env` | `src/config.js` |
| Idle timeout por mouse/teclado | `onStartShouldSetResponderCapture` + `AppState` |

El cálculo de rendimiento (litros, km/L, C$/km) y el precio del diésel siguen siendo responsabilidad del backend, igual que en el web.

---

## 6. Limitaciones conocidas

1. **Recuperación de contraseña por correo**: el enlace de Supabase abre en el navegador, no en la app. Para que el evento `PASSWORD_RECOVERY` llegue a la app hay que configurar deep linking (`AndroidManifest.xml` + Supabase Auth → URL Configuration). Mientras tanto, usá el dashboard de Supabase para regenerar contraseñas.
2. **Sin iOS**: sólo se generó `android/`.
3. **Sin notificaciones push ni GPS**: fuera del alcance actual.
4. **Fecha en modales**: se escribe a mano (`AAAA-MM-DD`) en vez de calendario nativo, para no agregar dependencias nativas.

---

## 7. Mantenimiento

### Cambios de UI

Sólo tocar `src/`; no hace falta recompilar Gradle. Reiniciá Metro con:

```powershell
npm.cmd run start -- --reset-cache
```

### Regenerar la parte nativa

Si perdés la carpeta `android/` o cambiás la versión de React Native, regenerala con el **mismo nombre** que `app.json` (eso lo fija `MainActivity.getMainComponentName()` y `settings.gradle`):

```powershell
npx @react-native-community/cli@15.0.1 init CCMFleetMobile --version 0.76.5 `
  --skip-install --skip-git-init --pm npm --title "CCM FleetManager" `
  --directory .\tmp-native

Remove-Item -Recurse -Force .\android
Move-Item .\tmp-native\android .\android
Remove-Item -Recurse -Force .\tmp-native
```

No copies `App.tsx`, `tsconfig.json` ni `package.json` del template: este proyecto es JavaScript y ya tiene los suyos.

Si actualizás `react-native` a otra versión, alineá también `@react-native/babel-preset` y `@react-native/metro-config` en `package.json`.

### Cambios nativos

Permisos, dependencias con link nativo, `strings.xml`: editar dentro de `android/` y volver a compilar con `npm run android`.

---

## 8. API consumida

Mismos endpoints que el cliente web, definidos en `src/lib/api.js`:

| Grupo | Endpoints |
|---|---|
| Vehículos | `GET/POST /api/vehicles`, `PUT/DELETE /api/vehicles/:id`, `PATCH /api/vehicles/:id/status` |
| Kilometraje | `PUT /api/vehicles/:id/kilometraje`, `POST .../kilometraje/dias`, `GET .../historial-kilometraje`, `PUT/DELETE .../historial-kilometraje/:entryId` |
| Combustible | `GET/POST /api/combustible`, `PUT/DELETE /api/combustible/:id`, `GET /api/vehicles/:id/historial-combustible` |
| Catálogos | `GET/POST /api/conductores`, `PUT/DELETE /api/conductores/:id`, `GET/POST /api/rutas`, `PUT/DELETE /api/rutas/:id` |

Cada petición adjunta el `Authorization: Bearer <access_token>` de la sesión Supabase activa.
