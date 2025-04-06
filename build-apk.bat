@echo off
echo 🚀 Compilation de l'APK Android en cours...

REM Aller dans le dossier android
cd android

REM Lancer la compilation en debug
call gradlew assembleDebug

REM Vérifier si l'APK est généré
IF EXIST app\build\outputs\apk\debug\app-debug.apk (
    echo ✅ APK généré avec succès :
    echo %cd%\app\build\outputs\apk\debug\app-debug.apk
) ELSE (
    echo ❌ Échec de la génération de l'APK.
)

pause
