'use strict';

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');

inputType.value = 'running';

class workOut {
  clicks = 0;
  date = new Date();
  id = (Date.now() + ' ').slice(-10);
  constructor(coords, distance, duration) {
    this.coords = coords;
    this.distance = distance;
    this.duration = duration;
  }

  _description() {
    // prettier-ignore
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    this.description = `${this.type[0].toUpperCase() + this.type.slice(1)} on ${
      months[this.date.getMonth()]
    } ${this.date.getDate()}`;
  }
  _click(){
    this.clicks++;
  }
}

class running extends workOut {
  type = 'running';
  constructor(coords, distance, duration, cadence) {
    super(coords, distance, duration);
    this.cadence = cadence;
    this._calcPace();
    this._description();
  }

  _calcPace() {
    this.pace = this.distance / this.duration;
    return this.pace;
  }
}

class cycaling extends workOut {
  type = 'cycling';
  constructor(coords, distance, duration, elevation) {
    super(coords, distance, duration);
    this.elevation = elevation;
    this._calcSpeed();
    this._description();
  }

  _calcSpeed() {
    this.speed = this.distance / this.duration;
    return this.speed;
  }
}

class app {
  #map;
  #mapEvent;
  
  constructor() {
    this._getPosition();
    this.worksOut = [];
    this._getLocalStorage();

    form.addEventListener('submit', this._newWorkOut.bind(this));

    inputType.addEventListener('change', this._toggleElevationFeild);
  
    containerWorkouts.addEventListener('click',this._moveToPopup.bind(this));
  }

  _getPosition() {
    navigator.geolocation.getCurrentPosition(
      this._loadMap.bind(this),
      function () {
        alert('can not get your position!');
      }
    );
  }

  _loadMap(position) {
    const { latitude } = position.coords;
    const { longitude } = position.coords;

    const coords = [latitude, longitude];

    this.#map = L.map('map').setView(coords, 13);
    this.#map.on('click', this._showForm.bind(this));

    L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);
      if(this.worksOut)
        this.worksOut.forEach(work => this._randerMarker(work))
  }

  _showForm(mapE) {
    this.#mapEvent = mapE;
    form.style.display = 'grid';
    form.classList.remove('hidden');
    inputDistance.focus();
  }

  _hideForm(){
    inputDistance.value = inputDuration.value = inputCadence.value = inputElevation.value =
    '';

  form.style.display = 'none';
  form.classList.add('hidden');
  setTimeout(() => (form.style.display = 'grid'), 1000);
  }

  _toggleElevationFeild() {
    inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
    inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
  }

  _newWorkOut(e) {
    const isNumber = (...inputs) => inputs.every(inp => Number.isFinite(inp));
    const isPositive = (...inputs) => inputs.every(inp => inp > 0);

    e.preventDefault();

    /////////////////////////// input data

    const input = inputType.value;

    const dist = +inputDistance.value;
    const duration = +inputDuration.value;
    const { lat, lng } = this.#mapEvent.latlng;
    let workOut;

    if (input === 'running') {
      const cad = +inputCadence.value;
      if (!isNumber(dist, duration, cad) || !isPositive(dist, duration, cad))
        return alert('Enter a valid Number ');
      workOut = new running([lat, lng], dist, duration, cad);
    }

    if (input === 'cycling') {
      const Elev = +inputElevation.value;
      if (!isNumber(dist, duration, Elev) || !isPositive(dist, duration))
        return alert('Enter Valid Number');
      workOut = new cycaling([lat, lng], dist, duration, Elev);
    }
    console.log(this);
    this.worksOut.push(workOut);


    /////////////// making marker /////////////////

    this._randerMarker(workOut);
    this._randerWorkout(workOut);
    this._setLocalStorage();

    /////////clearing form  /////////////////////////
    inputDistance.value =
      inputDuration.value =
      inputElevation.value =
      inputCadence.value =
        ' ';



    /////////// hide form

    this._hideForm();


  }
  _randerMarker(workOut) {
    L.marker(workOut.coords)
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxWidth: 250,
          minWidth: 100,
          autoClose: false,
          closeOnClick: false,
          className: `${workOut.type}-popup`,
        })
      )
      .setPopupContent(
        `${workOut.type} ${workOut.type === 'running' ? '🏃' : '🚴'} ${
          workOut.distance
        } km  ⏱ ${workOut.duration} min`
      )
      .openPopup();
  }

  _randerWorkout(workOut) {
    let html = `
      <li class="workout workout--${workOut.type}" data-id="${workOut.id}">
      <h2 class="workout__title">${workOut.description}</h2>
      <div class="workout__details">
        <span class="workout__icon"> ${
          workOut.type === 'running' ? '🏃' : '🚴'
        } </span>
        <span class="workout__value">${workOut.distance}</span>
        <span class="workout__unit">km</span>
      </div>
      <div class="workout__details">
        <span class="workout__icon">⏱</span>
        <span class="workout__value">${workOut.duration}</span>
        <span class="workout__unit">min</span>
      </div>

      `;
    if (workOut.type === 'running')
      html += `
        <div class="workout__details">
        <span class="workout__icon">⚡️</span>
        <span class="workout__value">${workOut.pace.toFixed(1)}</span>
        <span class="workout__unit">min/km</span>
      </div>
        <div class="workout__details">
        <span class="workout__icon">🦶🏼</span>
        <span class="workout__value">${workOut.cadence}</span>
        <span class="workout__unit">spm</span>
        </div>
      </li>
        `;

    if (workOut.type === 'cycling')
      html += `
      <div class="workout__details">
      <span class="workout__icon">⚡️</span>
      <span class="workout__value">${workOut.speed}</span>
      <span class="workout__unit">min/km</span>
    </div>
      <div class="workout__details">
      <span class="workout__icon">⛰</span>
      <span class="workout__value">${workOut.elevation}</span>
      <span class="workout__unit">m</span>
      </div>
     </li>
      `;
    form.insertAdjacentHTML('afterend', html);
  }

  _moveToPopup(e){
    const workOutEl = e.target.closest('.workout');
    
    if(!workOutEl) return;

    const workout = this.worksOut.find(work => work.id === workOutEl.dataset.id)
    //workout._click();
    
    this.#map.setView(workout.coords,13,{
      Animation: true,
      pan:{
        duration:1
      }
    });
  }

  _setLocalStorage(){
    localStorage.setItem('workouts',JSON.stringify(this.worksOut));
  }
  _getLocalStorage(){
    const data = localStorage.getItem('workouts');
    
    if(data)
      this.worksOut = JSON.parse(data);

    if(!this.worksOut) return;

    this.worksOut.forEach(work =>this._randerWorkout(work));
  }

  _reset(){
    localStorage.removeItem('workouts');
    location.reload();
  }




}

const App = new app();

// ///////////////form submit event .....//////////////

// /////////////////////////////////input type ...///////////
