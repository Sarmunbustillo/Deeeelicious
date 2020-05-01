function autocomplete(input, latInput, lngInput) {
  if (!input) return; //skip this fn from running if there is not input on page

  const dropdown = new google.maps.places.Autocomplete(input);

  dropdown.addListener('place_changed', () => {
    const places = dropdown.getPlace();
    latInput.value = places.geometry.location.lat();
    lngInput.value = places.geometry.location.lng();
  });

  //if someone hits enter on the address field will not sumbit the form

  //we can use .on because we are using the packagae bling.js its like adding an event listener
  input.on('keydown', (e) => {
    if (e.keycode === 13) e.preventDefault();
  });
}

export default autocomplete;
