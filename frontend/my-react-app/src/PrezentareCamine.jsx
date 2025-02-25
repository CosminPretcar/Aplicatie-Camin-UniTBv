import React from "react";
import "bootstrap/dist/css/bootstrap.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import "./styles/PrezentareCamine.css";

function PrezentareCamine() {
  return (
    <div className="container mt-4">
      <h1 className="text-center mb-4">Prezentarea Căminelor Studențești în cadrul UniTBv</h1>
      
      {/* Secțiune: Introducere */}
      <div className="card mb-3">
        <div className="card-body">
          <h5 className="card-title"><i className="bi bi-house-door-fill"></i> Introducere</h5>
          <p className="card-text">
            Dacă ai ajuns pe această pagină, cel mai probabil te pregătești să devii student la <span>Universitatea Transilvania din Brașov (UniTBv)</span> . Felicitări pentru acest pas important! Una dintre primele tale preocupări, pe lângă alegerea programului de studii, este, cu siguranță, găsirea unui loc de cazare potrivit.
          </p>
          <p className="card-text">
          Căminele studențești reprezintă una dintre cele mai populare opțiuni de cazare pentru studenții din întreaga lume, oferind nu doar un loc accesibil din punct de vedere financiar, ci și un mediu prielnic pentru învățare, socializare și dezvoltare personală.
          </p>
          <p className="card-text">
            Pentru mulți studenți, căminul devine a doua casă pe durata studiilor universitare. Faptul că ești înconjurat de colegi cu aceleași preocupări îți oferă oportunitatea de a crea conexiuni valoroase și de a împărtăși experiențele academice. Viața în cămin nu este doar despre confortul unui loc de dormit, ci și despre apartenența la o comunitate dinamică, unde fiecare zi poate aduce noi prietenii și experiențe memorabile.
          </p>
          <p className="card-text">
          Pe lângă avantajele sociale, căminele UniTBv sunt amplasate în proximitatea facultăților, reducând timpul și costurile de transport. În plus, acestea oferă diverse facilități, cum ar fi acces la internet, spații de studiu, bucătării comune și servicii de securitate, aspecte care contribuie la un trai organizat și eficient. 
          </p>
          <p className="card-text">
          Alegerea unui cămin potrivit este un pas important pentru orice student. Este esențial să ții cont de aspecte precum condițiile de locuire, tipul camerei, regulile impuse și, bineînțeles, costurile implicate. Fiecare cămin are propriile sale particularități, iar informațiile corecte și actualizate te pot ajuta să faci cea mai bună alegere pentru tine.
          </p>
          <div className="alert alert-info text-center" role="alert">
            📌 **Știați că?** Multe cămine organizează evenimente și proiecte educaționale, oferind un mediu dinamic și stimulant pentru studenți!
          </div>
        </div>
      </div>

      <div className="card mb-3">
        <div className="card-body">
          <h5 className="card-title">Locația complexelor studențești</h5>
          <div className="row">
            {/* Prima coloană - Complex Colina */}
            <div className="col-md-6">
              <h6 className="text-center">Complex Colina</h6>
              <iframe 
                src="https://www.google.com/maps/embed?pb=!1m17!1m12!1m3!1d697.210682839591!2d25.59820226961552!3d45.6539799356112!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m2!1m1!2zNDXCsDM5JzE0LjMiTiAyNcKwMzUnNTUuOSJF!5e0!3m2!1sro!2sro!4v1740490065957!5m2!1sro!2sro" 
                style={{ width: "100%", height: "400px", border: 0 }} 
                allowFullScreen 
                loading="lazy" 
                referrerPolicy="no-referrer-when-downgrade">
              </iframe>

              <div className="card mt-3">
                <div className="card-body">
                  <h5 className="card-title text-center">Despre Complexul Colina</h5>
                  <p><i className="bi bi-house-door-fill"></i> Acest complex se află chiar în incinta Universității, oferind studenților acces rapid la cursuri și facilități academice.</p>
                  <p><i className="bi bi-people-fill"></i> Camerele sunt prevăzute cu patru paturi, având grup sanitar comun pentru fiecare două camere, iar în Căminul 16 fiecare cameră beneficiază de baie proprie.</p>
                  <p><i className="bi bi-tools"></i> Oferă o gamă diversificată de facilități, inclusiv un teren de sport, un club de biliard și ping-pong, un magazin alimentar și o terasă.</p>
                  <p><i className="bi bi-eye-fill"></i> Siguranța este asigurată prin supraveghere video și prezența Poliției Universitare, oferind un mediu protejat pentru studenți.</p>
                </div>
              </div>
            </div>

            <div className="col-md-6">
              <h6 className="text-center">Complex Memorandului</h6>
              <iframe 
                src="https://www.google.com/maps/embed?pb=!1m14!1m8!1m3!1d1658.257782698645!2d25.581514695547053!3d45.65391329267895!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x40b35ba0289adb4d%3A0x2500e09f47a625d5!2sMemorandului!5e0!3m2!1sro!2sro!4v1740492072412!5m2!1sro!2sro" 
                style={{ width: "100%", height: "400px", border: 0 }}  
                allowFullScreen 
                loading="lazy" 
                referrerPolicy="no-referrer-when-downgrade">
              </iframe>

              {/* Card pentru Complexul Memorandului */}
              <div className="card mt-3">
                <div className="card-body">
                  <h5 className="card-title text-center">Despre Complexul Memorandului</h5>
                  <p><i className="bi bi-house-door-fill"></i> Aflat la aproximativ 20 de minute de mers pe jos de facultăți, acest complex beneficiază de acces facil la transportul public.</p>
                  <p><i className="bi bi-people-fill"></i> Camerele sunt dotate cu 3-4 paturi, iar grupurile sanitare sunt comune pe fiecare etaj, care poate fi fie mixt, fie destinat exclusiv unui singur gen.</p>
                  <p><i className="bi bi-tools"></i> Are bucătării comune, săli de lectură și spații pentru spălare, iar în apropiere se află parcuri cu aparate pentru exerciții în aer liber, ideale pentru recreere.</p>
                  <p><i className="bi bi-eye-fill"></i> Siguranța este asigurată prin supraveghere video și prezența Poliției Universitare, oferind un mediu protejat pentru studenți.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>





      {/* Secțiune: Tipuri de cămine */}
      <div className="card mb-3">
        <div className="card-body">
          <h5 className="card-title"><i className="bi bi-building"></i> Tipuri de Cămine</h5>
          <ul className="list-group">
            <li className="list-group-item">Cămine administrate de universitate</li>
            <li className="list-group-item">Cămine private</li>
            <li className="list-group-item">Camere single, duble sau multiple</li>
          </ul>
        </div>
      </div>

      {/* Secțiune: Facilități */}
      <div className="card mb-3">
        <div className="card-body">
          <h5 className="card-title"><i className="bi bi-tools"></i> Facilități</h5>
          <p>Căminele oferă diverse facilități, inclusiv:</p>
          <div className="row">
            <div className="col-md-4"><i className="bi bi-wifi"></i> Internet</div>
            <div className="col-md-4"><i className="bi bi-basket"></i> Bucătărie comună</div>
            <div className="col-md-4"><i className="bi bi-shield-lock"></i> Securitate 24/7</div>
          </div>
        </div>
      </div>

      {/* Secțiune: Avantaje și Dezavantaje */}
      <div className="row">
        <div className="col-md-6">
          <div className="card text-white bg-success mb-3">
            <div className="card-body">
              <h5 className="card-title"><i className="bi bi-hand-thumbs-up"></i> Avantaje</h5>
              <ul>
                <li>Costuri reduse</li>
                <li>Aproape de universitate</li>
                <li>Comunitate de studenți</li>
              </ul>
            </div>
          </div>
        </div>
        <div className="col-md-6">
          <div className="card text-white bg-danger mb-3">
            <div className="card-body">
              <h5 className="card-title"><i className="bi bi-hand-thumbs-down"></i> Dezavantaje</h5>
              <ul>
                <li>Zgomot și lipsă de intimitate</li>
                <li>Reguli stricte</li>
                <li>Condiții diferite în funcție de cămin</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Secțiune: Proces de aplicare */}
      <div className="card mb-3">
        <div className="card-body">
          <h5 className="card-title"><i className="bi bi-pencil-square"></i> Proces de Aplicare</h5>
          <p>Înscrierea pentru un loc în cămin implică următorii pași:</p>
          <ol className="list-group list-group-numbered">
            <li className="list-group-item">Depunerea cererii online</li>
            <li className="list-group-item">Selecția pe baza criteriilor stabilite</li>
            <li className="list-group-item">Confirmarea locului și plata taxei</li>
          </ol>
        </div>
      </div>

      {/* Secțiune: Concluzie */}
      <div className="alert alert-primary text-center" role="alert">
        Alegerea unui cămin este o decizie importantă! Informează-te bine și alege opțiunea potrivită pentru tine!
      </div>
    </div>
  );
}

export default PrezentareCamine;
