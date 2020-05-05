import axios from 'axios';
import dompurify from 'dompurify';

function searchResultsHtml(stores) {
  return stores
    .map((store) => {
      return `
        <a href='/store/${store.slug}' class='search__result'>
            <strong>${store.name}</strong>
        </a>`;
    })
    .join('');
}

function typeAhead(search) {
  if (!search) return;

  const searchInput = search.querySelector('input[name="search"]');
  const searchResults = search.querySelector('.search__results');

  searchInput.on('input', function () {
    // if there is no value, quit it!
    if (!this.value) {
      searchResults.style.display = 'none';
      return; // stop
    }

    // show search results!
    searchResults.style.display = 'block';

    axios
      .get(`/api/search?q=${this.value}`)
      .then((res) => {
        if (res.data.length) {
          searchResults.innerHTML = dompurify.sanitize(searchResultsHtml(res.data));
          return;
        }
        //tell them nothing came back
        searchResults.innerHTML = dompurify.sanitize(`
        <div class='search__result'>No results for ${this.value} found!<div>
        `);
      })
      .catch((err) => {
        console.error(err);
      });
  });

  //handle keyboard inputs so we can traverse with arrow up, down and search on enter
  searchInput.on('keyup', (e) => {
    //if there arent pressing, up, down or enter, who cares!
    if (![38, 40, 13].includes(e.keyCode)) {
      return; // nah skip it!
    }
    //otherwise do something
    const activeClass = 'search__result--active';
    const current = search.querySelector(`.${activeClass}`);
    const items = search.querySelectorAll('.search__result');
    let next;

    //if the key arrow down is pressed before (if there is a current)
    if (e.keyCode === 40 && current) {
      // the  items[0] will make if we reach the last element it will jump back t the first one
      next = current.nextElementSibling || items[0];
    } else if (e.keyCode === 40) {
      next = items[0];
    } else if (e.keyCode === 38 && current) {
      next = current.previousElementSibling || items[items.length - 1];
    } else if (e.keyCode === 38) {
      next = items[items.length - 1];
    }
    // handle enter if enter is pressed and the current element has a href
    else if (e.keyCode === 13 && current.href) {
      window.location = current.href;
      //if you go to the link stop this func from running
      return;
    }
    if (current) {
      current.classList.remove(activeClass);
    }
    next.classList.add(activeClass);
  });
}

export default typeAhead;
