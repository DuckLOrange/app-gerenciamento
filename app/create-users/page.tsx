'use client';

import { useEffect, useState } from 'react';
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, doc, setDoc } from "firebase/firestore";
import { getAuth, createUserWithEmailAndPassword, signOut } from "firebase/auth";

const firebaseConfig = {
    apiKey: "AIzaSyD0kB8YuswSczIm0NN8y_PrZOX8rsKnckg",
    authDomain: "app-gerenciamento-44d01.firebaseapp.com",
    projectId: "app-gerenciamento-44d01",
    storageBucket: "app-gerenciamento-44d01.firebasestorage.app",
    messagingSenderId: "87622104511",
    appId: "1:87622104511:web:c21140fdb91ea345519d0a"
};

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

const usersToCreate = [
    { username: 'SoeliHeming', password: 'Soeli@11', nome: 'Soeli Heming', role: 'admin' },
    { username: 'Thailan', password: 'Thailan@11', nome: 'Thailan', role: 'usuario' },
    { username: 'Saymon', password: 'Saymon@11', nome: 'Saymon', role: 'usuario' }
];

export default function CreateUsers() {
    const [status, setStatus] = useState<string>('Iniciando...');

    useEffect(() => {
        async function run() {
            let log = 'Iniciando criação...\\n';
            for (const u of usersToCreate) {
                try {
                    const email = `${u.username}@app.com`;
                    const cred = await createUserWithEmailAndPassword(auth, email, u.password);
                    await setDoc(doc(db, "perfisUsuarios", cred.user.uid), {
                        id: cred.user.uid,
                        username: u.username,
                        nome: u.nome,
                        role: u.role,
                        criadoEm: new Date().toISOString()
                    });
                    log += `✅ CRIADO: ${u.username}\\n`;
                } catch (e: any) {
                    if (e.code === 'auth/email-already-in-use') {
                        log += `⚠️ JÁ EXISTE: ${u.username}\\n`;
                    } else {
                        log += `❌ ERRO (${u.username}): ${e.message}\\n`;
                    }
                }
            }
            await signOut(auth);
            log += 'CONCLUÍDO!';
            setStatus(log);
        }
        run();
    }, []);

    return (
        <div style={{ padding: 40, fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
            <h1>Criador de Usuários em Lote</h1>
            <div id="status-output">{status}</div>
        </div>
    );
}
