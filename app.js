const express = require('express')
const request = require('request')

const jsdom = require("jsdom");
const { JSDOM } = jsdom;

const app = express()
app.get('/:from', async function (req, res) {
    request(`https://www.x-rates.com/table/?from=${req.params.from}&amount=1`, function (error, response, html) {
    if (!error && response.statusCode == 200) {
        const resp = [[{from: req.params.from }]]
        const currencyrates = []
        const dom = new JSDOM(html);
        const document = dom.window.document;
        const list = document.querySelector('.tablesorter.ratesTable > tbody').children
        
        resp.forEach.call(list, (el) => {
            const name = el.children[0].textContent;
            const currency = el.children[1];
            const currencyText = currency.textContent;
            const url = currency.children[0].getAttribute('href')
            const symbole = url.substring(url.indexOf('to')+3)
            const obj = {
                name,
                rate: currencyText,
                symbole,
            }
            currencyrates.push(obj)
        })
        resp.push(currencyrates)
        res.json(resp)
    }
    });
})

app.get('/:from/:to', async function (req,res) {
    if (req.params.from === req.params.to) res.json({from: req.params.from, to: req.params.to, currency: 1})
    request(`https://www.x-rates.com/table/?from=${req.params.from}&amount=1`, function (error, response, html) {
        if (!error && response.statusCode == 200) {
            try {
                const result = []
            const dom = new JSDOM(html);
            const document = dom.window.document;
            const list = document.querySelector('.tablesorter.ratesTable > tbody').children
            var arr = Array.prototype.slice.call( list )

            const temp = arr.filter((item) => {
                const td = item.children[1];
                const a = td.children[0];
                const href = a.getAttribute('href')
                const symbole = href.substring(href.indexOf('to')+3)
                return symbole.toLowerCase() ===  req.params.to
            })
            if (temp.length === 0) {
                res.json(
                    {
                        error: `There is no match such currency symbol: ${req.params.to}`,
                        status: 404
                    }
                )
                return ''
            }
            result.push({
                from: req.params.from,
                to: req.params.to,
                rate: temp[0].children[1].textContent
            })
            res.json(result)
            } catch (error) {
                res.json(
                    {
                        error: `There is no such currency symbole: ${req.params.from}`,
                        status: 404
                    }
                )
            }
        } else if(error) {
            res.json(
                {
                    error: `Something went wrong`,
                    status: 400
                }
            )
        }
        });
})
const PORT = process.env.PORT || 8008
app.listen(PORT, () => console.log(`server is up at http://localhost:${PORT}/`))