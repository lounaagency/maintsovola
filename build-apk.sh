#!/bin/bash

echo "🚀 Compilation APK Android avec Gradle..."

# Aller dans le dossier Android
cd android || {
  echo "❌ Dossier android introuvable !"
  exit 1
}

# Lancer la compilation debug
./gradlew assembleDebug

# Vérification du succès
APK_PATH="app/build/outputs/apk/debug/app-debug.apk"
if [ -f "$APK_PATH" ]; then
  echo "✅ APK généré avec succès :"
  echo "$PWD/$APK_PATH"
else
  echo "❌ Erreur lors de la génération de l'APK."
fi
