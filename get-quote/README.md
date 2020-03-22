# get-quote

Takes a security symbol (equity, etf, etc.) and gets a current quote for it.

## Setup

0) Please use node v12.16.1:
```
nvm use
```

1) Install dependencies:
```
npm i
```

2) Create a `.env` file that looks like `.env_SAMPLE` and add your key (called "Consumer Key" in your TD developer app).

3) Edit the symbol passed to the script in the `package.json` file.

## Run Script

```
npm start
```

## Run Automated Tests

```
npm test
```
