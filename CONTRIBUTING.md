# Contributing

jsdiff was originally written by Kevin Decker (https://github.com/kpdecker) but is presently maintained by Mark Amery (https://github.com/ExplodingCabbage) (henceforth "I").

Please post bug reports and feature requests at https://github.com/kpdecker/jsdiff/issues.

In particular, also feel free to post bugs that could amount to denial-of-service vulnerabilities as public issues. jsdiff has had a handful of such vulnerabilities in the past, caused by bugs where some function has extremely bad time complexity on adversarial input, or in one case a bug whereby adversarial input to `parsePatch` could cause it to go into an infinite loop consuming memory without bound until the JavaScript runtime crashed. I have never heard of them being exploited in the wild, and am generally of the view that denial-of-service vulnerabilities in libraries are typically not especially serious and do not warrant the careful private disclosure that is properly applied to more serious vulnerabilities - so please just chuck them on the public issue tracker. (All that notwithstanding, I will still try to fix them promptly when reported.)

In the extremely unlikely scenario that you find something more serious than a denial-of-service vulnerability (though I can't even imagine what this would be), please *do* keep it private and reach out to me and Kevin via the email addresses listed in `package.json`.

PRs are welcome (https://github.com/kpdecker/jsdiff/pulls). PRs with tests are even welcomer. I often reject them if I decide I prefer a slightly different approach, though, so the chance of wasting work is high.

(I don't promise to address absolutely *everything* but since taking over maintainership from Kevin I have cleaned up the majority of issues and PRs.)

## Building and testing

```
yarn
yarn test
```

To run tests in a *browser* (for instance to test compatibility with Firefox, with Safari, or with old browser versions), run `yarn karma start`, then open http://localhost:9876/ in the browser you want to test in. Results of the test run will appear in the terminal where `yarn karma start` is running.

If you notice any problems, please report them to the GitHub issue tracker at
[http://github.com/kpdecker/jsdiff/issues](http://github.com/kpdecker/jsdiff/issues).

## Releasing (maintainers only)

Run a test in Firefox via the procedure above before releasing.

A full release may be completed by first updating the `"version"` property in package.json, then running the following:

```
yarn clean
yarn build
yarn npm publish
```

After releasing, remember to:
* commit the `package.json` change and push it to GitHub
* create a new version tag on GitHub
* update `diff.js` on the `gh-pages` branch to the latest built version from the `dist/` folder.
