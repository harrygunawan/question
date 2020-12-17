router.get("/summary-card", async (req, res) => {
    let Cards = {
      daily: 0,
      monthly: 0,
      yearly: 0,
      merchant: 0,
      pmt: 0,
    };
  
    let count = await Summaries.countDocuments();
  
    if (count === 0) {
      Cards.daily = 0;
      Cards.monthly = 0;
      Cards.yearly = 0;
      console.log({
        site: req.headers["site-destination"],
        data: Cards
      });
      return res.send({
        status: 200,
        data: Cards,
      });
    } else {
      let options = {
        _id: 0,
        merchant: 1,
        year: 1,
      };
      let theDate = dayjs().date();
      let theMonth = dayjs().format("MMM").toLowerCase();
      let theYear = dayjs().format("YYYY");
  
      try {
        options[`${theMonth}.values`] = {
          $filter: {
            input: `$${theMonth}.values`,
            as: "tax",
            cond: {
              $eq: ["$$tax.day", theDate],
            },
          },
        };
        let [dailyDoc] = await Summaries.aggregate()
          .match({
            year: theYear,
          })
          .project(options)
          .unwind(`$${theMonth}.values`)
          .group({
            _id: null,
            tax: {
              $sum: `$${theMonth}.values.tax`,
            },
          });
  
        delete options[`${theMonth}.values`];
        // Cards.daily = `Rp. ${dailyDoc.tax}`
        Cards.daily = dailyDoc.tax;
  
        options[`${theMonth}.total`] = 1;
        let [monthlyDoc] = await Summaries.aggregate()
          .match({
            year: theYear,
          })
          .project(options)
          .group({
            _id: null,
            tax: {
              $sum: `$${theMonth}.total`,
            },
          });
  
        delete options[`${theMonth}.total`];
        Cards.monthly = monthlyDoc.tax;
  
        let [yearlyDoc] = await Summaries.aggregate()
          .match({
            year: theYear,
          })
          .project({
            total: 1,
          })
          .group({
            _id: null,
            tax: {
              $sum: "$total",
            },
          });
  
        Cards.yearly = yearlyDoc.tax;
  
        let [merchantDoc] = await Device.aggregate()
          .group({
            _id: "$merchant.name",
          })
          .count("merchant");
  
        Cards.merchant = merchantDoc.merchant;
  
        let [deviceDoc] = await Device.aggregate([{ $match: { status: 1 } }])
          .group({
            _id: "$name",
          })
          .count("pmt");
  
        Cards.pmt = deviceDoc.pmt;
  
        console.log({
          site: req.headers["site-destination"],
          data: Cards
        });
        return res.send({
          status: 200,
          data: Cards,
        });
      } catch (error) {
        res.send({
          status: 500,
          message: error.message,
        });
      }
    }
  });