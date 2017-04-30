$('.button-collapse').sideNav();

const get = (path, callback) => {
  path = path.replace(/^\//, '').replace(/\/$/, '');
  $.ajax({
    url: `https://api.amperboard.com/${path}/`,
    type: "GET",
    crossDomain: true,
    success: callback,
    error: console.log.bind(console, 'Error:')
  });
};


const post = (path, callback) => {
  path = path.replace(/^\//, '').replace(/\/$/, '');
  $.ajax({
    url: `https://api.amperboard.com/${path}/`,
    type: "POST",
    crossDomain: true,
    success: callback,
    error: console.log.bind(console, 'Error:')
  });
};

const color = i => {
  return `rgb(${parseInt(26 * i + 216 * (1 - i))}, ${parseInt(35 * i + 27 * (1 - i))}, ${parseInt(126 * i + 96 * (1 - i))})`;
}

get('/items', data => {
  const items = data.sort((a, b) => b.consumption - a.consumption).filter(a => a.consumption > 500);
  const html = items.map(item => `
    <div class="item item-${item.id} draggable" style="background: ${color((item.consumption - 500) / 500)}; height: ${item.consumption / 10}px;">
      <div class="consumption">${item.consumption} Wh</div>
      <p>${item.name}</p>
    </div>
  `).join('');
  $('.plan .estimation').html(html);
});

get('/reports/past_day', data => {
  get('capacity-hour/past_day', capacity => {
    console.log(data.map(one => one.time), capacity.map(one => one.hour));
    data = data.map(one => {
      if (typeof one.time === 'string') {
        one.time = new Date(one.time);
      }
      return one;
    });

    const grouped = [];

    for (let h = 0; h < 24; h++) {
      grouped[h] = data.filter(item => item.time.getHours() === h);
    }

    const coor = grouped.reduce((obj, range, x) => {
      obj[x] = {
        x,
        y: range.reduce((total, item) => {
          return total + item.consumption;
        }, 0)
      };
      return obj;
    }, []);

    console.log(capacity.sort((a, b) => new Date(a.hour) - new Date(b.hour)).map(one => one.hour));
    capacity = capacity.map(data => ({
      x: new Date(data.hour).getHours(),
      y: data.capacity
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
                backgroundColor: 'rgba(99, 255, 132, 0.2)',
                borderColor: 'rgba(99,255,132,1)',
            }]
        },
        options: {
          scales: {
            xAxes: [{
              type: 'linear',
              position: 'bottom'
            }]
          }
        }
    });
  });
});

get('/reports/pending_tasks', data => {
  const html = data.slice(0, 5).map(task => `
    <div class="col s6 m12">
      <div class="card horizontal">
          <!-- <img src="/public/${task.item.name}.png"> -->
          <div class="card-content">

            <p>
              <span class="time">
                ${new Date(task.date).getHours()}:${new Date(task.date).getMinutes()}
              </span>
              ${task.item.name}
            </p>
          </div>
        </div>
      </div>
    </div>
  `).join('');
  $('.history .pending').html(html);
});

dragula($('.day').get());
$('.drop').each((i, el) => {
  dragula([...$('.estimation').get(), el], {
    copy: function (el, source) {
      return source && $(source).is('.estimation');
    },
    accepts: function (el, target) {
      return target && !$(target).is('.estimation');
    }
  });
});
