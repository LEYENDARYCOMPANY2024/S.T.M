#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <HTTPClient.h>
#include <Wire.h>
#include <MPU6050_light.h>
#include <Preferences.h>
#include <ArduinoJson.h>
const char* ssid = "nombre_de_la_red";
const char* password = "contrasena";

const String BACKEND_URL = "https://URL_DE_LA_WEB";
const String CORREO_TERAPEUTA = "CORREO_DEL_TERAPEUTA";
const String NOMBRE_DISPOSITIVO = "NOMBRE_DEL_DISPOSITIVO";
const String TIPO_DISPOSITIVO = "TIPO_DE_DISPOSITIVO";

MPU6050 mpu(Wire);
Preferences preferences;

String uuid = "";
int idPaciente = -1;
int idSesionDispositivo = -1;
String ladoPierna = "";
bool dispositivoActivado = false;
bool permisoEnvio = false;
bool configuracionCargada = false;

void conectarWiFi() {
  Serial.print("Conectando a WiFi");
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println(" ✅ Conectado!");
}

void registrarDispositivo() {
  preferences.begin("iot_config", true);
  String storedCorreo = preferences.getString("correo", "");
  String storedNombre = preferences.getString("nombre", "");
  String storedUUID = preferences.getString("uuid", "");
  preferences.end();

  // ⚠️ Si el nombre o correo cambiaron, hay que forzar registro
  if (storedCorreo != CORREO_TERAPEUTA || storedNombre != NOMBRE_DISPOSITIVO) {
    preferences.begin("iot_config", false);
    preferences.clear();
    preferences.end();
    uuid = "";  // Forzar nuevo registro
    Serial.println("🔁 Cambió el terapeuta o el nombre del dispositivo. Limpiando configuración.");
  } else {
    uuid = storedUUID;  // ✅ Solo usar UUID si la configuración coincide
  }

  if (uuid != "") {
    Serial.println("🔄 UUID ya presente: " + uuid);
    return;
  }


  WiFiClientSecure client;
  client.setInsecure();

  HTTPClient http;
  http.begin(client, BACKEND_URL + "/dispositivos/registrar");
  http.addHeader("Content-Type", "application/json");

  String json = "{\"correo\":\"" + CORREO_TERAPEUTA +
                "\",\"nombre\":\"" + NOMBRE_DISPOSITIVO +
                "\",\"tipo\":\"" + TIPO_DISPOSITIVO + "\"}";

  int code = http.POST(json);
  if (code == 200 || code == 201) {
    String res = http.getString();
    int start = res.indexOf("\"uuid\":\"") + 8;
    int end = res.indexOf("\"", start);
    uuid = res.substring(start, end);

    preferences.begin("iot_config", false);
    preferences.putString("uuid", uuid);
    preferences.putString("correo", CORREO_TERAPEUTA);
    preferences.putString("nombre", NOMBRE_DISPOSITIVO);
    preferences.end();

    Serial.println("✅ Registrado! UUID: " + uuid);
  } else {
    Serial.printf("❌ Registro fallido [%d]: %s\n", code, http.getString().c_str());
  }
  http.end();
}

bool obtenerConfiguracionDesdeBackend() {
  if (uuid == "") return false;

  WiFiClientSecure client;
  client.setInsecure();

  HTTPClient http;
  http.begin(client, BACKEND_URL + "/esp/id_paciente_por_uuid/" + uuid);
  int code = http.GET();

  if (code == 404) {
    Serial.println("⏳ Esperando activación desde frontend para obtener configuración...");
    http.end();
    return false;
  }

  if (code == 200) {
    String response = http.getString();
    StaticJsonDocument<512> doc;
    DeserializationError error = deserializeJson(doc, response);

    if (!error) {
      preferences.begin("iot_config", false);
      preferences.putInt("id_paciente", (int)doc["id_paciente"]);
      preferences.putInt("sessDevID", (int)doc["id_sesion_dispositivo"]);
      preferences.putString("lado_pierna", (const char*)doc["lado_pierna"]);
      preferences.end();

      preferences.begin("iot_config", true);
      idPaciente = preferences.getInt("id_paciente", -1);
      idSesionDispositivo = preferences.getInt("sessDevID", -1);
      ladoPierna = preferences.getString("lado_pierna", "");
      preferences.end();

      Serial.println("✅ Configuración obtenida:");
      Serial.println("👤 idPaciente: " + String(idPaciente));
      Serial.println("📶 idSesionDispositivo: " + String(idSesionDispositivo));
      Serial.println("🦿 ladoPierna: " + ladoPierna);
      return true;
    } else {
      Serial.println("❌ Error al deserializar JSON");
    }
  } else {
    Serial.printf("❌ Error HTTP [%d]: %s\n", code, http.getString().c_str());
  }

  http.end();
  return false;
}


void verificarEstadoDispositivo() {
  if (uuid == "") return;

  WiFiClientSecure client;
  client.setInsecure();
  HTTPClient http;
  http.begin(client, BACKEND_URL + "/dispositivos/estado/" + uuid);
  int code = http.GET();

  if (code == 200) {
    String response = http.getString();
    dispositivoActivado = (response.indexOf("activo") != -1);
    Serial.println(dispositivoActivado ? "✅ ACTIVADO" : "⛔ DESACTIVADO");
  }
  http.end();
}

void verificarPermisoEnvio() {
  if (uuid == "") return;

  WiFiClientSecure client;
  client.setInsecure();
  HTTPClient http;
  http.begin(client, BACKEND_URL + "/dispositivos/permiso_envio/" + uuid);
  int code = http.GET();

  if (code == 200) {
    String response = http.getString();
    permisoEnvio = response.indexOf("true") != -1;
    Serial.println(permisoEnvio ? "🟢 Permiso de envío: ON" : "🔴 Permiso de envío: OFF");
  }
  http.end();
}

void enviarDatos() {
  if (uuid == "" || idSesionDispositivo == -1 || ladoPierna == "" || idPaciente == -1) {
    Serial.println("⚠️ Datos incompletos para enviar");
    return;
  }

  WiFiClientSecure client;
  client.setInsecure();
  HTTPClient http;
  http.begin(client, BACKEND_URL + "/graficas/datos");
  http.addHeader("Content-Type", "application/json");

  StaticJsonDocument<256> doc;
  doc["uuid"] = uuid;
  doc["id_sesion_dispositivo"] = idSesionDispositivo;
  doc["lado_pierna"] = ladoPierna;
  doc["nombre_grafica"] = NOMBRE_DISPOSITIVO;

  mpu.update();
  doc["aceleracion_x"] = mpu.getAccX();
  doc["aceleracion_y"] = mpu.getAccY();

  String json;
  serializeJson(doc, json);

  int code = http.PUT(json);
  if (code == 200 || code == 201) {
    Serial.println("📤 Datos enviados");
  } else {
    Serial.printf("❌ Fallo [%d]: %s\n", code, http.getString().c_str());
  }

  http.end();
}

void setup() {
  Serial.begin(115200);
  Wire.begin();
  conectarWiFi();

  // 🧹 Validar si la configuración anterior no corresponde al dispositivo actual
  preferences.begin("iot_config", true);
  String oldCorreo = preferences.getString("correo", "");
  String oldNombre = preferences.getString("nombre", "");
  preferences.end();

  // Si no coincide el nombre o correo, limpiar por completo
  if (oldCorreo != CORREO_TERAPEUTA || oldNombre != NOMBRE_DISPOSITIVO) {
    Serial.println("🧹 Configuración anterior inválida, eliminando...");
    preferences.begin("iot_config", false);
    preferences.clear();
    preferences.end();
  }


  preferences.begin("iot_config", true);
  uuid = preferences.getString("uuid", "");
  idPaciente = preferences.getInt("id_paciente", -1);
  idSesionDispositivo = preferences.getInt("sessDevID", -1);
  ladoPierna = preferences.getString("lado_pierna", "");
  preferences.end();

  Serial.println("📦 UUID: " + uuid);
  Serial.println("👤 idPaciente: " + String(idPaciente));
  Serial.println("📶 idSesionDispositivo: " + String(idSesionDispositivo));
  Serial.println("🦿 ladoPierna: " + ladoPierna);

  if (uuid == "") registrarDispositivo();

  verificarEstadoDispositivo();

  byte status = mpu.begin();
  if (status != 0) {
    Serial.println("❌ Error con MPU6050");
    while (true);
  }

  Serial.println("✅ MPU listo. Calibrando...");
  mpu.calcOffsets();
}

unsigned long lastCheck = 0;
unsigned long lastConfigCheck = 0;
unsigned long lastPermisoCheck = 0;

void loop() {
  if (!configuracionCargada && uuid != "") {
    configuracionCargada = obtenerConfiguracionDesdeBackend();
  }
  

  // Reintentar si no hay datos válidos
  if (millis() - lastConfigCheck > 5000 && (idPaciente == -1 || idSesionDispositivo == -1 || ladoPierna == "")) {
    Serial.println("🔁 Reintentando obtener configuración...");
    configuracionCargada = obtenerConfiguracionDesdeBackend();
    lastConfigCheck = millis();

  }

  if (configuracionCargada && idPaciente != -1 && idSesionDispositivo != -1 && ladoPierna != "") {
    // No volver a hacer reintentos, está todo bien
    lastConfigCheck = millis(); // Reset para evitar ejecución de nuevo
  }  

  if (dispositivoActivado && idSesionDispositivo != -1) {
    if (millis() - lastPermisoCheck > 500) {
      verificarPermisoEnvio();
      lastPermisoCheck = millis();
    }
  
    if (permisoEnvio) {
      enviarDatos();
    } else {
      Serial.println("⏸️ Esperando permiso...");
    }
  
    delay(5);
  } else {
    if (millis() - lastCheck > 5000) {
      verificarEstadoDispositivo();
      lastCheck = millis();
    }
  }
}
