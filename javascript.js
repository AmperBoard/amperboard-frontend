$('.button-collapse').sideNav();

var ask = {
  tuesday: ['Dishwasher'],
  friday: ['Sandwich maker', 'Oven'],
  sunday: ['TV', 'Dryer', 'Microwave'],
  wednesday: ['Hair dryer', 'Iron'],
  thursday: ['Coffee maker', 'Dishwasher'],
  monday: ['Sandwich maker', 'Vacuum cleaner'],
  saturday: ['Air conditioner', 'Dishwasher'],
};


var get = (path, callback) => {
  path = path.replace(/^\//, '').replace(/\/$/, '') + '/';
  if (/\?/.test(path)) path = path.replace(/\/$/, '');
  $.ajax({
    url: `https://api.amperboard.com/${path}`,
    type: "GET",
    crossDomain: true,
    success: callback,
    error: console.log.bind(console, 'Error:')
  });
};


var post = (path, data, callback) => {
  path = path.replace(/^\//, '').replace(/\/$/, '') + '/';
  if (/\?/.test(path)) path = path.replace(/\/$/, '');
  $.ajax({
    url: `https://api.amperboard.com/${path}`,
    data: data,
    type: "POST",
    crossDomain: true,
    success: callback,
    error: console.log.bind(console, 'Error:')
  });
};

var color = i => {
  return `rgb(${parseInt(26 * i + 216 * (1 - i))}, ${parseInt(35 * i + 27 * (1 - i))}, ${parseInt(126 * i + 96 * (1 - i))})`;
}

get('/items', data => {
  var items = data.sort((a, b) => b.consumption - a.consumption).filter(a => a.consumption > 500);
  var html = items.map(item => `
    <div class="item item-${item.id} draggable" style="background: ${color((item.consumption - 500) / 500)}; height: ${item.consumption / 10}px;">
      <div class="consumption">${item.consumption} Wh</div>
      <p>${item.name}</p>
    </div>
  `).join('');
  $('.plan .estimation').html(html);

  $('.ask').click(e => {
    let i = 0;
    var pars = $('.item p').get();
    for (day in ask) {
      ask[day].forEach(text => {
        let items = pars.filter(el => el.innerHTML === text);
        if (items.length) {
          ((item, day) => {
            setTimeout(() => {
              $(item).closest('.item').clone().appendTo('.day.' + day);
            }, i * 250);
            i++;
          })(items[0], day);
        }
      });
    }
    $(e.target).remove();
  });
});

get('/reports/past_day', data => {
  get('/historical-generation/?timestamp=1493821820', capacity => {
    data = data.map(one => {
      if (typeof one.time === 'string') {
        one.time = new Date(one.time);
      }
      return one;
    });

    var grouped = [];

    for (let h = 0; h < 24; h++) {
      grouped[h] = data.filter(item => item.time.getHours() === h);
    }

    var coor = grouped.reduce((obj, range, x) => {
      obj[x] = {
        x: -x,
        y: range.reduce((total, item) => {
          return total + Math.abs(item.consumption);
        }, 0)
      };
      obj[x].y = obj[x].y / 2;
      return obj;
    }, []);

    capacity = capacity.sort((a, b) => new Date(a.hour) - new Date(b.hour)).map(data => ({
      x: -data.hour,
      y: parseInt(data.energy)
    }));

    // Any of the following formats may be used
    var ctx = document.getElementById('history');
    Chart.defaults.global.defaultFontColor = '#fff';
    var scatterChart = new Chart(ctx, {
        type: 'line',
        data: {
            datasets: [{
                label: 'Hourly consumption',
                data: coor,
                backgroundColor: 'rgba(255, 99, 132, 0.2)',
                borderColor: 'rgba(255,99,132,1)',
            }, {
                label: 'Available capacity',
                data: capacity,
                backgroundColor: 'rgba(100, 255, 218, .2)',
                borderColor: 'rgb(100, 255, 218)',
            }]
        },
        options: {
          scales: {
            xAxes: [{
              type: 'linear',
              position: 'bottom',
              ticks: {
                  min: -24,
                  max: 0
              }
            }]
          }
        }
    });
  });
});

get('/reports/pending_tasks', data => {
  var html = data.slice(0, 5).map(task => `
    <div class="card horizontal">
      <div class="card-content">
        <p>
          <span class="time">
            ${(new Date(task.date)).toTimeString().substr(0,5)}
          </span>
          ${task.item.name}
        </p>
      </div>
    </div>
  `).join('');
  $('.history .pending').html(html);
});

setInterval(() => {
  // CONNECTED
  get('/items/on_items', data => {
    var html = data.filter(item => item.id && item.id !== null).map(item => `
      <div class="col m4">
        <div class="card horizontal">
          <div class="card-image">
            <img src="/public/${item.name}.png">
          </div>
          <div class="card-content">
            <p>
              <strong>${item.name}</strong>
            </p>
            <p>
              ${item.consumption}
            </p>
          </div>
        </div>
      </div>
    `).join('');
    $('.connected').html(html);
  });
}, 1000);


// Maximum daily
get('days/week', data => {

  let max = Math.max.apply(Math, data.map(one => one.capacity));
  data = data.forEach(item => {
    item.date = new Date(item.date);
    let day = $('.week .day').get(item.date.getDay());
    $(day).append(`<div class="point" style="height: ${100 - 100 * (item.capacity / max)}px"></div>`);
  });

  console.log(data);

  // $('.weekly').html(html);
});



var drake = dragula($('.day').get(), {
  removeOnSpill: true
}).on('drag', function (el) {
  if (el.classList.contains('point')) {
    drake.cancel(true);
  }
});
var drakes = [];
$('.drop').each((i, el) => {
  drakes[i] = dragula([...$('.estimation').get(), el], {
    copy: function (el, source) {
      return source && $(source).is('.estimation');
    },
    accepts: function (el, target) {
      return target && !$(target).is('.estimation');
    }
  }).on('over', function(el, container){
    var available = $(container).height() - $(container).find('.point').height();
    var used = $(container).find('.item').get().reduce((all, one) => {
      return all + $(one).height();
    }, $(el).height());
    var good = available > used;
    if (available && !good) {
      container.classList.add('error');
    }
  }).on('out', function(){
    $('.drop').removeClass('error');
  }).on('drop', function (el, container) {
    var available = $(container).height() - $(container).find('.point').height();
    var used = $(container).find('.item').get().reduce((all, one) => {
      return all + $(one).height();
    }, 0);
    var good = available > used;
    console.log(available, used, good);
    if (available && !good) {
      drakes[i].cancel(true);
    }
  });
});








// Google Places
var placeSearch, autocomplete;

function initAutocomplete() {
  // Create the autocomplete object, restricting the search to geographical
  // location types.
  autocomplete = new google.maps.places.Autocomplete(
    document.getElementById('place'));

  // When the user selects an address from the dropdown, populate the address
  // fields in the form.
  autocomplete.addListener('place_changed', fillInAddress);
}

function fillInAddress() {
  // Get the place details from the autocomplete object.
  var place = autocomplete.getPlace();

  document.querySelector('[name="latitude"]').value = place.geometry.location.lat();
  document.querySelector('[name="longitude"]').value = place.geometry.location.lng();
  document.querySelector('[name="place_id"]').value = place.place_id;
}

// Bias the autocomplete object to the user's geographical location,
// as supplied by the browser's 'navigator.geolocation' object.
function geolocate() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(function(position) {
      var geolocation = {
        lat: position.coords.latitude,
        lng: position.coords.longitude
      };
      var circle = new google.maps.Circle({
        center: geolocation,
        radius: position.coords.accuracy
      });
      autocomplete.setBounds(circle.getBounds());
    });
  }
}

console.log($('form.settings'));

$('form.settings').on('submit', function(e){
  console.log('TU PUUUU');
  e.preventDefault();
  post('user-config', $(e.target).serialize(), function(e){
    window.location.reload();
  });
});
