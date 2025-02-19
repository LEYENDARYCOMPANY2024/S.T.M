## S.M.M

El Sistema Terapéutico de la Marcha (S.M.M) es una herramienta de monitoreo basada en IoT, diseñada para evaluar la marcha en pacientes con problemas de movilidad. Utiliza sensores inerciales para capturar datos en tiempo real y permite a los terapeutas analizar el progreso a través de una plataforma web y una aplicación móvil.

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

### Desactivar

```shell
deactivate
```

# Instalar las librerias 

## Instalar NeoFetch

```shell
sudo apt-get neofetch -y
```

## Actualizar Pip

```shell
pip install  --upgrade pip
```

## Actualizar versiones de librerias y paquetes instalables
```shell
sudo apt-get update
```

## Para este proyecto se usaran las librerias de [FastAPI](https://fastapi.tiangolo.com/#typer-the-fastapi-of-clis)

```shell
pip install "fastapi[standard]"
```

# Requirements y Runtime

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

## 📧 Contacto
Para cualquier duda o sugerencia, puedes contactar a [leyendary2024@gmail.com].
