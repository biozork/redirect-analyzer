# Redirect Analyzer. What it is
Simple Node.JS api that will let you see info about every jump in a chained redirect. This API will show response status on each jump in a redirect chain, and return the entire chain as an array of objects for your own manipulation.

If a jump resolves to 404, you can even try to "Fix dead" redirects, by adding the `"fixDead":true` parameter. That will look at the last jump that resolves to 404, and move backwards on the urlstructure until it finds a path that is no longer 404.

## Why I made the tool
Personally I have used this API to check redirects in order to resolve chained redirects, and to find, and potentially fix dead redirects for SEO purposes. But I guess you can use this for whatever you would like.

## Install
`npm install`

You can also deploy directly to Heroku:

[![Deploy](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy?template=https://github.com/biozork/redirect-analyzer)
<br><br>

## Call the API
Running localhost - First start the server: `npm app`

Then you can do POST requests to the API via `localhost:5000/api`

## Request format
API only accepts POST requests in JSON with the following paramters
| Param | Description | Required | 
| ----- | ----------- | -------- |
| `url` | Absolute path to check for redirects. | Yes |
| `fixDead` | If hitting a dead (404) jump, try to resolve it | No |

<br>

**Exaple POST Request to the API:**
```
{
    "url": "http://ing.dk/247528"
}
```


## Response parameters

| Key | Description |
| --- | ----- |
| `statusCode` | resolved http response statuscode on end-point |
| `resolvedUrl` | the resolved url from end of redirect chain |
| `jumpCount` | number of jumps the redirect made to resolve |
| `jumps` | array of objects, containing jump object info |

**Example response:**
```
{
    "statusCode": 200,
    "resolvedUrl": "https://www.google.dk/",
    "jumpCount": 1,
    "jumps": [...]
}
```

<br>

The `jumps` array have the following response keys:
| Key | Description |
| --- | ----------- |
| `statusCode` | http response statuscode on the specific redirect jump |
| `jumpFrom` | the absolute url the redirect came from |
| `jumpTo` | the absolute url the redirect points to |

**Example response:**
```
    [
    	{
            "statusCode": 301,
            "jumpFrom": "http://ing.dk/247528",
            "jumpTo": "https://ing.dk/247528"
        },
        {
            "statusCode": 301,
            "jumpFrom": "https://ing.dk/247528",
            "jumpTo": "https://ing.dk/artikel/skader-underernaering-gives-videre-boern-247528"
        }
    ]
```

<br>

## Example: A single redirct
**POST Request to the API:**
```
{
    "url": "https://google.dk"
}
```
**Response:**
```
{
    "statusCode": 200,
    "resolvedUrl": "https://www.google.dk/",
    "jumpCount": 1,
    "jumps": [
        {
            "statusCode": 301,
            "jumpFrom": "https://google.dk",
            "jumpTo": "https://www.google.dk/"
        }
    ]
}
```

### Example: Chained redirect
**POST Request to the API:**
```
{
    "url": "http://ing.dk/247528"
}
```
**Response:**
```
{
    "statusCode": 200,
    "resolvedUrl": "https://ing.dk/artikel/skader-underernaering-gives-videre-boern-247528",
    "jumpCount": 2,
    "jumps": [
        {
            "statusCode": 301,
            "jumpFrom": "http://ing.dk/247528",
            "jumpTo": "https://ing.dk/247528"
        },
        {
            "statusCode": 301,
            "jumpFrom": "https://ing.dk/247528",
            "jumpTo": "https://ing.dk/artikel/skader-underernaering-gives-videre-boern-247528"
        }
    ]
}
```

### Example: Redirect that dies with 404
**POST Request to the API:**
```
{
    "url": "http://ing.dk/2475128"
}
```
**Response:**
```
{
    "statusCode": 404,
    "resolvedUrl": "https://ing.dk/2475128",
    "jumpCount": 1,
    "jumps": [
        {
            "statusCode": 301,
            "jumpFrom": "http://ing.dk/2475128",
            "jumpTo": "https://ing.dk/2475128"
        }
    ]
}
```

### Example: Redirect that dies with 404, however fixed with fixDead parameter
**POST Request to the API:**
```
{
    "url": "http://ing.dk/2475128",
    "fixDead": true
}
```
**Response:**
```
{
    "statusCode": 200,
    "resolvedUrl": "https://ing.dk",
    "jumpCount": 2,
    "jumps": [
        {
            "statusCode": 301,
            "jumpFrom": "http://ing.dk/2475128",
            "jumpTo": "https://ing.dk/2475128"
        },
        {
            "statusCode": 404,
            "jumpFrom": "https://ing.dk/2475128",
            "jumpTo": "https://ing.dk"
        }
    ]
}
```



