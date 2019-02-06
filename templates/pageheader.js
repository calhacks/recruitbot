const render = title => {
    return `
<!DOCTYPE html>
<html lang="en">

  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="ie=edge">
    <title>${title}</title>
    <link href="https://fonts.googleapis.com/css?family=Muli:400,400i,800" rel="stylesheet">
    <link rel="stylesheet" href="/static/css/main.css">
  </head>

  <body>
    <header>
      <div class="logo">
        <h1><span class="desktoponly">RecruitBot</span> 🤖</h1>
      </div>
      <nav>
        <a href="/results">Results</a>
        <a href="/stats">Stats</a>
        <a href="/submissions">Start grading</a>
      </nav>
    </header>
    <main>
    `;
}

module.exports = render;
