## S.T.M

El Sistema Terapéutico de la Marcha (S.T.M) es una herramienta de monitoreo basada en IoT, diseñada para evaluar la marcha en pacientes con problemas de movilidad. Utiliza sensores inerciales para capturar datos en tiempo real y permite a los terapeutas analizar el progreso a través de una plataforma web y una aplicación móvil.

# Guardar Cambios en ramas y repositorio

Traer los Cambios a la rama que estes trabajando
```shell
git pull origin pruebas --rebase
```

comando de guardado de cambios
```shell
git add .
git commit -m "Descripción de los cambios"
```

Actualizar cambios solamente en tu rama propia
```shell
git push -u origin nombre_de_rama
```

# configurar proyecto
## Creacion del virtual environment

```
python -m venv smm
```

## activar y desactivar el virtual environment 

### Activar
```shell
source smm/bin/activate
```   
```shell
deactivate
```

# Instalar las librerias 
## Si ya creaste el archivo instala el requirements.txt

```shell
pip install -r requirements.txt
```

## Instalar NeoFetch

```shell
sudo apt-get neofetch -y
```

## Actualizar Pip

```shell
pip install --upgrade pip
```

## Actualizar versiones de librerias y paquetes instalables
```shell
sudo apt-get update
```

## Para este proyecto se usaran las librerias de [FastAPI](https://fastapi.tiangolo.com/#typer-the-fastapi-of-clis)

```shell
pip install "fastapi[standard]"
```

## Para conexión a la base de datos de [supabase](https://supabase.com/)

```shell
pip install supabase
```

## Otras librerias necesarias para la base de datos (si no están instaladas)

```shell
pip install python-dotenv uvicorn
```

## instalar la libreria para la encryptation de la contraseña, para mas seguridad.
```shell
pip install bcrypt
```
## instalar librerias necesarias para las sesiones de supabase

```shell
pip install sqlalchemy
```

```shell
pip install pyjwt
```

```shell
pip install psycopg2-binary
```

## Para este proyecto se utilizó la plataforma PlatformIO

se puede instalar en las extensiones de visual estudio code, simplemente buscan en la barra de busqueda PlatformIO y en la primera opción aparecerá una extensión con un icono de un alien, se instala y despues ses instalan las librerías automáticamente, los comando de la terminal dedicada para esa plataforma que támbien utiliza arduino son:

```shell
pio run
```

`este comando ejecutará el archivo c++ para validar que funcione correctamente ('compilar')`

```shell
pio run --target upload
```

`este comando permitirá subir el codigo a la esp32 o el dispositivo que estemos utilizando, solo debemos conectar a un puerto el dispositivo a la computadora y posteriormente ejecutar este comando una vez que el comando llegué a la parte de conexión al puerto presionamos el botón de BOOT para permitir subir el código (esto dependiendo del dispositivo)`

```shell
pio device monitor
```

`este comando permitirá revisar el estado del dispositivo o en pocas palabras la ejecución del codigo y ver lo que sucede en la terminal, para ello debe de estar conectado el dispositivo a la computadora mediante cable, se puede reiniciar el monitor presionando en el dispositivo RE de "reset"`

# Crear archivos para la ejecución
## Crear el archivo .env (necesario para la conexión a la abse de datos)

```
DATABASE_URL=postgresql://<DB_USER>:<DB_PASSWORD>@<DB_HOST>:<DB_PORT>/<DB_NAME>
SUPABASE_URL=https://<SUPABASE_PROJECT>.supabase.co
SUPABASE_KEY=<SUPABASE_ANON_KEY>
SECRET_KEY=<YOUR_SECRET_KEY>
```
## Archivo de la carpeta test app_prueba_bd.py

Contiene la configuración para validar la conexión con la base de datos, cabe aclarar que para validar que si hay conexión con la base de datos se debe de hacer una consulta a una tabla, es por ello que se realiza la consulta a la tabla 'test' que contiene 1 registro el cual deberá imprimir, de otra forma, arrojará un error.

## Crear el archivo requirements.txt
```shell
pip freeze > requirements.txt
```

## Crear el archivo runtime.txt

```shell
python -V > runtime.txt
```

## ver carateristicas del sistema operativo

```shell
neofetch
```

## Crear el archivo os.txt

```shell
uname -a > os.txt
```

## Crear el archivo .gitignore

```
_pycache_/
*.pyc
smm/
.env/
```

# Iniciar la ejecucion del proyecto 



```shell
uvicorn app:app --reload
```

# NOTAS:

## Si un archivo el cual quieres ignorar ya fue agregado al repositorio, debes eliminarlo del seguimiento de Git con los siguientes comandos:

```shell
git rm --cached <archivo ignorado>
git commit -m "Ignorar archivo <archivo ignorado>"
git push origin <tu_rama>
```

# si tiene cambios desatados ocupa este comando:

```shell
git reset --hard
```

## si el navegador no hace cambios

`Presiona Ctrl + Shift + R (Windows/Linux) o Cmd + Shift + R (Mac).`

## eliminar pycache y archivo temporales de python

```shell
find . -name "__pycache__" -type d -exec rm -r {} +
find . -name "*.pyc" -delete
```

## eliminar comentarios que generaste en github

```shell
git reset --hard HEAD~N
```
NONTA: N significa el numero de commits que quieres retroceder

## 📧 Contacto
Para cualquier duda o sugerencia, puedes contactar a [leyendary2024@gmail.com].
