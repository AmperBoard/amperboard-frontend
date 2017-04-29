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

get('/items', data => {
  const items = data.sort((a, b) => b.consumption - a.consumption).filter(a => a.consumption > 350);
  const html = items.map(item => `
    <div class="item item-${item.id} col s12 m2" style="height: ${item.consumption / 10}px; background: ${chance.color({format: 'rgb'}).replace(/\)/, ', 0.3)')};">
      <img src="public/washing.png">
    </div>
  `).join('');
  $('.plan .estimation').html(html);
});

get('/reports/past_day', data => {
  console.log(data);

  // Any of the following formats may be used
  var ctx = document.getElementById('history');
  var scatterChart = new Chart(ctx, {
      type: 'line',
      data: {
          datasets: [{
              label: 'Scatter Dataset',
              data: [{
                  x: -10,
                  y: 0
              }, {
                  x: 0,
                  y: 10
              }, {
                  x: 10,
                  y: 5
              }],
              backgroundColor: 'rgba(255, 99, 132, 0.2)',
              borderColor: 'rgba(255,99,132,1)',
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

get('/reports/pending_tasks', data => {
  const html = data.map(task => `
    <div class="col s12 m4">
      <div class="card horizontal">
        <div class="card-image">
          <img src="/public/washing.png">
        </div>
        <div class="card-stacked">
          <div class="card-content">
            <p>${task.item.name}</p>
            <a class="waves-effect waves-light btn-flat">
              <i class="material-icons left">schedule</i> ${task.date.split(':').slice(0, 2).join(':')}
            </a>
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
