import React from "react";
import "bootstrap/dist/css/bootstrap.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import "./styles/PrezentareCamine.css";

function PrezentareCamine() {
  const reviews = [
    { name: "Andrei Popescu", text: "Am stat în Complexul Colina timp de 3 ani și experiența a fost una excelentă! Camerele sunt bine întreținute, iar comunitatea este foarte prietenoasă." },
    { name: "Maria Ionescu", text: "Complexul Memorandului a fost o alegere bună pentru mine datorită accesului ușor la mijloacele de transport. Grupurile sanitare comune sunt un mic dezavantaj, dar condițiile generale sunt acceptabile." },
  ]

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  
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
            📌**Știați că?** Multe cămine organizează evenimente și proiecte educaționale, oferind un mediu dinamic și stimulant pentru studenți!
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

      {/* Secțiune: Tipuri de camere*/}
      <div className="card mb-3">
        <div className="card-body">
          <h5 className="card-title text-center"><i className="bi bi-door-closed"></i> Prezentare Camere de Cămin</h5>

            <div className="row">
              {/* Card pentru camerele din Complexul Colina */}
              <div className="col-md-6">
                <div className="card">
                  <div className="card-body">
                  <h5 className="card-title text-center">Camere în Complexul Colina</h5>

                  <h6><i className="bi bi-house-door-fill"></i> Tipologie și Configurație</h6>
                  <p>
                    În <span>Complexul Colina</span>, camerele sunt dotate cu 
                    <span> 4 paturi</span>. Aceste camere sunt complet echipate cu 
                    <span> 4 dulapuri (dimensiuni)</span>, <span> două paturi supraetajate (dimensiuni)</span>,
                    <span> două birouri(dimensiuni)</span>, 
                    <span> un blat de lucru (dimensiuni)</span>, <span>două etajere</span> și 
                    <span> un dulap mobil cu 4 sertare</span>, oferind fiecărui student spațiu adecvat pentru depozitare și studiu.
                  </p>
                  <p>
                    Grupurile sanitare sunt <span>organizate în module</span>, fiecare deservind <span>două camere</span>. 
                    Fiecare modul dispune de <span>o toaletă</span>, <span>un duș</span> și 
                    <span> o chiuvetă cu oglindă</span>, asigurând un grad mai ridicat de intimitate și confort pentru studenți.
                    O excepție de la această organizare o reprezintă <span>Căminul 16</span>, unde fiecare cameră dispune de <span>baie proprie</span>.
                    De asemenea, pe etaj sunt disponibile 
                    <span> două mașini de spălat haine</span>, oferind studenților facilități esențiale pentru igienă și întreținerea rufelor.
                  </p>
                  <p>În **Căminul 16**, fiecare cameră dispune de **baie proprie**, în timp ce în restul căminelor grupul sanitar este comun pentru două camere.</p>
                  {/* <p>Pe fiecare etaj este disponibila o sala de lectura!</p> */}

                  <h6><i className="bi bi-tools"></i> Facilități în cameră</h6>
                  <ul>
                    <li>Fiecare student beneficiază de un spațiu individual de depozitare și studiu</li> 
                    <li>Acces la un dulap propriu, un birou sau un loc la blat de dimensiuni echivalente</li>
                    <li>Jumătate dintr-o etajeră și un raft din dulapul mobil, asigurând astfel un echilibru între organizare și confort.</li>
                    <li>4 prize duble si una simpla</li>
                    <li>Conexiune ethernet si Wi-Fi disponibile</li>
                    <li>Două lustre</li>
                  </ul>

                  <h6><i className="bi bi-wallet"></i>Obiecte necesare de achiziționat alături de colegi</h6>
                  <ul>
                    <li>Frigider</li>
                    <li>Cuptor cu microunde</li>
                    <li>Matura si mop pentru a mentine curatenia in camera</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Card pentru camerele din Complexul Memorandului */}
            <div className="col-md-6">
              <div className="card">
                <div className="card-body">
                <h5 className="card-title text-center">Camere în Complexul Memorandului</h5>

                <h6><i className="bi bi-house-door-fill"></i> Tipologie și Configurație</h6>
                <p>
                  În <span>Complexul Memorandului</span>, camerele sunt dotate cu 
                  <span> 3 sau 4 paturi</span>, cele cu <span>3 paturi</span>  având dimensiuni ușor reduse. 
                  Camerele cu <span>4 paturi</span> sunt complet echipate cu <span>4 dulapuri (dimensiuni)</span>, 
                  <span> două paturi supraetajate (dimensiuni)</span>, <span>două birouri(dimensiuni)</span>, 
                  <span> un blat de lucru (dimensiuni)</span>, <span>două etajere</span> și 
                  <span> un dulap mobil cu 4 sertare</span>, oferind fiecărui student spațiu adecvat pentru depozitare și studiu. 
                  În camerele cu <span>3 paturi</span>, din cauza numărului redus de locatari, 
                  <span> unele dintre aceste elemente pot lipsi</span> sau pot avea dimensiuni diferite pentru a optimiza spațiul disponibil. 
                </p>
                <p>
                  Grupurile sanitare sunt <span>comune pe etaj</span>, iar etajele pot fi 
                  <span> mixte sau unisex</span>, în funcție de organizarea căminului. 
                  Fiecare etaj dispune de <span>4 dușuri</span>, situate într-o cameră separată, 
                  <span> 5 chiuvete cu oglindă</span> într-o altă încăpere, precum și 
                  <span> 4 toalete</span> într-un spațiu distinct. De asemenea, pe etaj sunt disponibile 
                  <span> două mașini de spălat haine</span>, oferind studenților facilități esențiale pentru igienă și confort.
                </p>
                <p>Pe fiecare etaj este disponibila o sala de lectura!</p>

                <h6><i className="bi bi-tools"></i> Facilități în cameră</h6>
                  <ul>
                    <li>Fiecare student beneficiază de un spațiu individual de depozitare și studiu</li> 
                    <li>Acces la un dulap propriu, un birou sau un loc la blat de dimensiuni echivalente</li>
                    <li>Jumătate dintr-o etajeră și un raft din dulapul mobil, asigurând astfel un echilibru între organizare și confort.</li>
                    <li>4 prize duble si una simpla</li>
                    <li>Conexiune ethernet si Wi-Fi disponibile</li>
                    <li>Două lustre</li>
                  </ul>

                  <h6><i className="bi bi-wallet"></i>Obiecte necesare de achiziționat alături de colegi</h6>
                  <ul>
                    <li>Frigider</li>
                    <li>Cuptor cu microunde</li>
                    <li>Matura si mop pentru a mentine curatenia in camera</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="card mb-3">
        <div className="card-body">
          <h5 className="card-title text-center"><i className="bi bi-shield-check"></i> Igiena în Cămine</h5>

          <div className="row">
            {/* Primul rând de carduri */}
            <div className="col-md-6">
              <div className="card mb-3">
                <div className="card-body">
                  <h6><i className="bi bi-house-door-fill"></i> Curățenia în camere</h6>
                    <ul>
                      <li>Fiecare student este responsabil de curățenia propriei camere.</li>
                      <li>Se recomandă aerisirea zilnică și menținerea unui spațiu ordonat.</li>
                      <li>Gunoiul trebuie colectat regulat.</li>
                    </ul>
                </div>
              </div>
            </div>

            <div className="col-md-6">
              <div className="card mb-3">
                <div className="card-body">
                  <h6><i className="bi bi-water"></i> Întreținerea grupurilor sanitare</h6>
                  <ul>
                    <li>Curățenia băilor comune este asigurată periodic de personal.</li>
                    <li>Studenții trebuie să respecte regulile pentru menținerea igienei.</li>
                    <li>În <span>Căminul 16</span>, fiecare cameră dispune de baie proprie.</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div className="row">
            {/* Al doilea rând de carduri */}
            <div className="col-md-6">
              <div className="card mb-3">
                <div className="card-body">
                  <h6><i className="bi bi-wash"></i> Spălarea hainelor</h6>
                  <ul>
                    <li>Mașini de spălat disponibile pe fiecare etaj.</li>
                    <li>Utilizare conform programului stabilit.</li>
                    <li>Se recomandă folosirea detergenților potriviți.</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="col-md-6">
              <div className="card mb-3">
                <div className="card-body">
                  <h6><i className="bi bi-person-fill"></i> Norme de igienă personală</h6>
                  <ul>
                    <li>Spălarea frecventă a mâinilor și utilizarea dezinfectanților.</li>
                    <li>Păstrarea produselor de igienă în spații curate.</li>
                    <li>Evitarea împărțirii obiectelor personale</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Al treilea rând de carduri */}
          <div className="card mb-3">
            <div className="card-body">
              <h6><i className="bi bi-exclamation-triangle"></i> Măsuri speciale</h6>
              <ul>
                <li>Verificări periodice pentru menținerea igienei.</li>
                <li>Studenții pot sesiza administrația căminului în caz de probleme.</li>
              </ul>
            </div>
          </div>
          <div className="alert alert-success text-center" role="alert">
            ✅ Respectarea normelor de igienă asigură un mediu plăcut și sănătos pentru toți studenții!
          </div>
          {/* Alerta cu roșu pentru clarificare */}
          <div className="alert alert-danger text-center mt-3" role="alert">
            ⚠️ **Acestea sunt doar recomandări!** Deși universitatea implementează măsuri pentru igienă, <strong>responsabilitatea menținerii curățeniei revine fiecărui student.</strong> 
            Un mediu sănătos depinde de respectarea regulilor de către toți locatarii!
          </div>
        </div>
      </div>

      <div className="card mb-3">
        <div className="card-body">
          <h5 className="card-title text-center"><i className="bi bi-book"></i> Regulamentul Căminului</h5>

          <div className="row">
            <div className="col-md-6">
              <div className="card mb-3">
                <div className="card-body">
                  <h6><i className="bi bi-clock"></i> Program și liniște</h6>
                    <ul>
                      <li>Program de liniște: <span>22:00 - 07:00</span>. În acest interval, zgomotele puternice sunt interzise.</li>
                      <li>Vizitele sunt permise doar în intervalele aprobate de administrație.</li>
                      <li>Studenții trebuie să respecte programul căminului și să nu perturbe colegii.</li>
                    </ul>
                </div>
              </div>
            </div>

            <div className="col-md-6">
              <div className="card mb-3">
                <div className="card-body">
                  <h6><i className="bi bi-tools"></i> Utilizarea spațiilor comune</h6>
                  <ul>
                    <li>Folosirea bucătăriilor și a sălilor de lectură trebuie făcută cu grijă.</li>
                    <li>Studenții trebuie să curețe după ei și să nu blocheze accesul altor colegi.</li>
                    <li>Orice defecțiuni trebuie raportate administrației pentru reparații.</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div className="row">
            <div className="col-md-6">
              <div className="card mb-3">
                <div className="card-body">
                  <h6><i className="bi bi-exclamation-triangle"></i> Reguli privind siguranța</h6>
                  <ul>
                    <li>Este interzisă folosirea aparatelor electrocasnice neautorizate.</li>
                    <li>Accesul persoanelor străine în cămin este permis doar cu aprobarea administrației.</li>
                    <li>Fumatul și consumul de alcool în cămin sunt strict interzise.</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="col-md-6">
              <div className="card mb-3">
                <div className="card-body">
                  <h6><i className="bi bi-exclamation-octagon"></i> Sancțiuni pentru nerespectarea regulamentului</h6>
                  <ul>
                    <li>Avertismente scrise pentru abateri minore.</li>
                    <li>Excluderea temporară sau definitivă din cămin pentru încălcări grave.</li>
                    <li>Despăgubiri pentru daunele aduse mobilierului sau echipamentelor.</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Alerte pentru conștientizare */}
          <div className="alert alert-warning text-center" role="alert">
            ⚠️ **Respectarea regulamentului asigură un mediu sigur și plăcut pentru toți locatarii!**
          </div>
          <div className="alert alert-info text-center mt-3" role="alert">
            ℹ️ **Recomandăm citirea integrală a regulamentului pentru a evita eventuale neînțelegeri.**  
            <p>📜 **Accesează regulamentul complet aici:** </p>
            <a href="https://www.unitbv.ro/documente/despre-unitbv/regulamente-hotarari/regulamentele-universitatii/studenti/Regulament_camine_22.01.2025.pdf" target="_blank" rel="noopener noreferrer">
              Regulamentul Oficial al Căminelor UniTBv
            </a>
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
                <li><i className="bi bi-cash-stack"></i> Costuri reduse
                  {/* <ul><li><p>Cazarea la cămin este mult mai ieftină decât închirierea unui apartament.</p></li></ul> */}
                </li>
                <li><i className="bi bi-person-walking"></i> Proximitatea față de facultate</li>
                <li><i className="bi bi-people-fill"></i> Viață socială activă</li>
                <li> Acces la facilități comune</li>
                <li><i className="bi bi-book-half"></i> Mediu motivant pentru studiu</li>
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
                <li><i className="bi bi-book"> </i> Reguli stricte</li>
                <li>Condiții diferite în funcție de cămin</li>
                <li>Spațiu limitat</li>
                <li>Posibile conflicte cu colegii de cameră</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
      {/* Secțiune: Recenzii */}
      <div className="card mb-3">
        <div className="card-body">
          <h5 className="card-title text-center"><i className="bi bi-chat-left-text-fill"></i> Recenzii ale foștilor studenți</h5>
          <div className="list-group mb-3">
            {reviews.map((review, index) => (
              <div key={index} className="list-group-item">
                <h6><i className="bi bi-person-circle"></i> {review.name}</h6>
                <p>{review.text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
      {/* Butoane pentru navigare */}
      <div className="d-flex justify-content-between mb-4">
        <a href="/" className="btn btn-primary">
          <i className="bi bi-house-door"></i> Pagina Principală
        </a>
        <button onClick={scrollToTop} className="btn btn-secondary">
          <i className="bi bi-arrow-up-circle"></i> Înapoi Sus
        </button>
      </div>
    </div>
  );
}

export default PrezentareCamine;
