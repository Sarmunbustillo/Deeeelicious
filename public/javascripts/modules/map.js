import axios from 'axios';

const mapOptions = {
  center: {
    lat: 43.2,
    lng: -79.8,
  },
  zoom: 10,
};

function loadPlaces(map, lat = 43.2, lng = -79.8) {
  axios.get(`/api/stores/near?lat=${lat}&lng=${lng}`).then((res) => {
    const places = res.data;
    if (!places.length) {
      alert('No places found!');
      return;
    }
    //create a bounce
    const bounds = new google.maps.LatLngBounds();
    const infoWindow = new google.maps.InfoWindow();

    const markers = places.map((place) => {
      const [placeLgn, placeLat] = place.location.coordinates;
      const position = { lat: placeLat, lng: placeLgn };
      bounds.extend(position);
      const marker = new google.maps.Marker({ map, position });
      marker.place = place;
      return marker;
    });

    //when someone clicks on a marker show details of that place
    markers.forEach((marker) =>
      marker.addListener('click', function () {
        const html = `
          <div class="popup">
            <a href="/store/${this.place.photo}">
                <img src="/uploads/${this.place.photo || 'store.png'}" alt="${this.place.name}"/>
                <p>${this.place.name} - ${this.place.location.address}</p>
            </a>
          </div>
          `;

        infoWindow.setContent(html);
        infoWindow.open(map, this);
      })
    );

    //zoom the map to fit all the bounce perfectly
    map.setCenter(bounds.getCenter());
    map.fitBounds(bounds);
  });
}

function makeMap(mapDiv) {
  if (!mapDiv) return;
  //make map
  const map = new google.maps.Map(mapDiv, mapOptions);
  loadPlaces(map);

  const input = document.querySelector('[name="geolocate"]');
  const autocomplete = new google.maps.places.Autocomplete(input);
  autocomplete.addListener('place_changed', () => {
    const place = autocomplete.getPlace();
    loadPlaces(map, place.geometry.location.lat(), place.geometry.location.lng());
  });
}

export default makeMap;
