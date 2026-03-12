# Funzionalità Profilo Utente

## Descrizione

È stata implementata una pagina di profilo utente completa con la possibilità di modificare le informazioni personali e cambiare la password.

## File Creati/Modificati

### API Endpoints

1. **`pages/api/user/profile.ts`**
   - `GET`: Recupera le informazioni del profilo utente corrente
   - `PUT`: Aggiorna il nome e l'immagine del profilo

2. **`pages/api/user/change-password.ts`**
   - `POST`: Cambia la password dell'utente
   - Validazioni:
     - Password corrente deve essere corretta
     - Nuova password minimo 6 caratteri
     - Richiede autenticazione

### Pagine

3. **`pages/profile.tsx`**
   - Pagina del profilo utente con due sezioni:
     - **Informazioni Profilo**: Modifica nome utente
     - **Cambia Password**: Form per cambiare la password
   - Protetta da autenticazione (redirect a `/auth/signin` se non autenticato)
   - Feedback visivo per successo/errore delle operazioni

### Componenti Header

4. **`components/header/AppHeader.tsx`**
   - Aggiunto menu dropdown con:
     - Link al profilo utente
     - Informazioni utente (nome/email)
     - Logout

5. **`components/header/CineforumHeaderNav.tsx`**
   - Aggiunto menu dropdown desktop con link al profilo
   - Aggiunto link al profilo nel menu mobile

### Autenticazione

6. **`pages/api/auth/[...nextauth].ts`**
   - Aggiornati i callback JWT per sincronizzare il nome utente
   - Supporto per l'aggiornamento della sessione quando il profilo cambia

## Come Testare

### 1. Accesso alla Pagina Profilo

1. Effettua il login nell'applicazione
2. Clicca sul menu dropdown nell'header (nome utente o icona utente)
3. Seleziona "Profilo"
4. Verifica che la pagina `/profile` si carichi correttamente

### 2. Modifica Nome Utente

1. Nella sezione "Informazioni Profilo":
   - Modifica il campo "Nome"
   - Clicca su "Salva Modifiche"
   - Verifica il messaggio di successo verde
   - Controlla che il nome nell'header si aggiorni automaticamente

### 3. Cambio Password

1. Nella sezione "Cambia Password":
   - Inserisci la password corrente
   - Inserisci una nuova password (minimo 6 caratteri)
   - Conferma la nuova password
   - Clicca su "Cambia Password"
   - Verifica il messaggio di successo

2. **Test Validazioni**:
   - Prova con password corrente errata → Errore "Password corrente non corretta"
   - Prova con nuova password < 6 caratteri → Errore "La nuova password deve essere di almeno 6 caratteri"
   - Prova con password non corrispondenti → Errore "Le password non corrispondono"

3. **Test Logout e Re-login**:
   - Dopo aver cambiato la password, fai logout
   - Prova a fare login con la vecchia password → Dovrebbe fallire
   - Fai login con la nuova password → Dovrebbe funzionare

### 4. Test Protezione Autenticazione

1. Fai logout
2. Prova ad accedere direttamente a `/profile`
3. Verifica che vieni reindirizzato a `/auth/signin?callbackUrl=/profile`
4. Dopo il login, verifica di essere reindirizzato automaticamente al profilo

### 5. Test Responsive

1. Testa la pagina su dispositivi mobili o riduci la finestra del browser
2. Verifica che:
   - Il menu dropdown nell'header funzioni correttamente
   - Il menu mobile mostri il link "Profilo"
   - I form siano utilizzabili su schermi piccoli

## Funzionalità Implementate

✅ Visualizzazione informazioni profilo (nome, email, data registrazione)  
✅ Modifica nome utente  
✅ Cambio password con validazioni  
✅ Protezione autenticazione  
✅ Feedback visivo (successo/errore)  
✅ Aggiornamento automatico del nome nell'header  
✅ Menu dropdown nell'header con link al profilo  
✅ Supporto mobile  
✅ Toggle visibilità password  
✅ Validazione lato client e server

## Note Tecniche

- La password viene hashata con `bcryptjs` (10 rounds)
- La sessione viene aggiornata automaticamente dopo la modifica del profilo
- I messaggi di successo scompaiono automaticamente dopo 3 secondi
- L'email non può essere modificata (campo disabilitato)
- Tutti gli endpoint API richiedono autenticazione
