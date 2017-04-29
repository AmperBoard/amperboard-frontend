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
      <img src="/public/washing.png">
    </div>
  `).join('');
  $('.plan .estimation').html(html);
});

get('/past_day', data => {
  console.log(data);
});

get('/reports/pending_tasks/', data => {
  console.log(data);
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




// Any of the following formats may be used
var ctx = document.getElementById('history');
var myChart = new Chart(ctx, {
    type: 'bar',
    data: {
        labels: ['Red', 'Blue', 'Yellow', 'Green', 'Purple', 'Orange'],
        datasets: [{
            label: '# of Votes',
            data: [12, 19, 3, 5, 2, 3],
            backgroundColor: [
                'rgba(255, 99, 132, 0.2)',
                'rgba(54, 162, 235, 0.2)',
                'rgba(255, 206, 86, 0.2)',
                'rgba(75, 192, 192, 0.2)',
                'rgba(153, 102, 255, 0.2)',
                'rgba(255, 159, 64, 0.2)'
            ],
            borderColor: [
                'rgba(255,99,132,1)',
                'rgba(54, 162, 235, 1)',
                'rgba(255, 206, 86, 1)',
                'rgba(75, 192, 192, 1)',
                'rgba(153, 102, 255, 1)',
                'rgba(255, 159, 64, 1)'
            ],
            borderWidth: 1
        }]
    },
    options: {
        scales: {
            yAxes: [{
                ticks: {
                    beginAtZero:true
                }
            }]
        }
    }
});
