const units = ['°F', '°C', '°K'];
const convert = [function (c) { return c }, function (c) { return (c-32)*(5/9) }, function (c) { return (c+459.67)*(5/9)}]

let socket = null;
let tmp = 30;
let avg = 10;

let currentIdex = 0;

// Unit Changing

document.getElementById('unit').addEventListener("click", function () {
  currentIdex += 1;
  if (currentIdex >= units.length) currentIdex = 0;
  document.getElementById('unit').innerHTML = `<p>${units[currentIdex]}</p>`
  
  document.getElementById('temp').innerHTML = Math.round(convert[currentIdex](tmp) * 10) / 10;
  document.getElementById('avg').innerHTML = Math.round(convert[currentIdex](avg) * 10) / 10;
  document.getElementById('dev').innerHTML = Math.abs(Math.round(convert[currentIdex](avg) * 10 / 10 - convert[currentIdex](tmp) * 10 / 10));
});

// Align Top Boxes

let boxes = document.getElementsByClassName("unit");
let acu = 5;
Object.keys(boxes).forEach((e) => {
  boxes[e].style.marginRight = `${acu}px`;
  acu += 47;
});

// Update Data

function updateData(tmp, avg) {
  document.getElementById('temp').innerHTML = Math.round(convert[currentIdex](tmp) * 10) / 10;
  document.getElementById('avg').innerHTML = Math.round(convert[currentIdex](avg) * 10) / 10;
  document.getElementById('dev').innerHTML = Math.abs(Math.round(convert[currentIdex](avg) * 10 / 10 - convert[currentIdex](tmp) * 10 / 10));
}

// Websocket Init

window.onload = function () {
  createWebSocket();
}

function createWebSocket() {
  let wsProto = 'ws';
  if (location.protocol === 'https:') wsProto = 'wss';
  socket = new WebSocket(`${wsProto}://${window.location.href.split('/')[2]}`);

  socket.onopen = function () {
    setError(false);
  };

  socket.onmessage = function (event) {
      let data = JSON.parse(event.data);
      console.log(data)
      updateData(data.tmp, data.avg)
  };

  socket.onclose = function (event) {
      if (event.wasClean) return;
      if (event.code === 1000) return;
      setError(true)
      setTimeout(createWebSocket, 5000);
  }

  socket.onerror = function () {
    setError(true);
      setTimeout(createWebSocket, 5000);
  };
}

// Lost Connection Message

function setError(value) {
  if (value) {
      document.getElementById('error').innerHTML = '❌';
      return;
  }
  document.getElementById('error').innerHTML = '✅';
}

document.getElementById('error').addEventListener("click", function () {
  socket.close()
  createWebSocket()
});

/*Its 
let dataLen = 51
let i = -1
let labels = Array.from({length: dataLen}, () => i += 1);
let data = {
  labels: labels,
  datasets: [{
    label: 'Tempature',
    data: Array.from({length: dataLen}, () => Math.floor(Math.random() * dataLen)),
    fill: false,
    borderColor: 'rgb(75, 192, 192)',
    tension: 0.1
  }]
};
let config = {
  type: 'line',
  data: data,
};
var ctx = document.getElementById('myChart').getContext('2d');
var stackedLine = new Chart(ctx, config);

function addData(chart, label, data) {
    chart.data.labels.push(label);
    chart.data.datasets.forEach((dataset) => {
        dataset.data.push(data);
    });
    chart.update();
}

function removeData(chart) {
    chart.data.labels.pop();
    chart.data.datasets.forEach((dataset) => {
        dataset.data.shift();
    });
    chart.update();
}
*/