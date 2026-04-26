const FIREBASE_CONFIG = {
    apiKey: "AIzaSyCbV9iUHeXQecQEEahbAFaI5OeNCvSdiTI",
    authDomain: "ninemonthlfve-meow.firebaseapp.com",
    databaseURL: "https://ninemonthlfve-meow-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "ninemonthlfve-meow",
    storageBucket: "ninemonthlfve-meow.firebasestorage.app",
    messagingSenderId: "146262395264",
    appId: "1:146262395264:web:e97a5d82dbed5fa31fd965"
};

// Простая обёртка для работы с Firebase REST API
// (без подключения SDK — легче и проще для GitHub Pages)
const FirebaseDB = {
    baseURL: FIREBASE_CONFIG.databaseURL,

    async get(path) {
        try {
            const res = await fetch(`${this.baseURL}/${path}.json`);
            if (!res.ok) return null;
            return await res.json();
        } catch (e) {
            console.warn('Firebase GET error:', e);
            return null;
        }
    },

    async set(path, data) {
        try {
            const res = await fetch(`${this.baseURL}/${path}.json`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            return res.ok;
        } catch (e) {
            console.warn('Firebase SET error:', e);
            return false;
        }
    }
};
