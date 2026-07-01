# Multi module (monorepo) angular application

```shell
npm install
npm install --workspace angular-start-project-style
npm install --workspace angular-start-project-library
npm start -w angular-start-project
```

tab http://localhost:4200/

See [DEVELOPERS-GUIDE.md](DEVELOPERS-GUIDE.md) for day-to-day monorepo workflow: building, testing,
and updating/upgrading the `setmy-info-less` packages. See [review.md](review.md) for the current
plan and findings.

Set as:

    //"strict": true,
    "strict": false,
    "noImplicitAny": false,
    "strictNullChecks": false,
