const Order=require("../models/order");
const User=require("../models/user");
const Product=require("../models/product");
const Wallet=require('../models/wallet')

const dateConvert=require('../public/javascripts/dateConvert')
let title="Orders"
const pdf = require('html-pdf');
const fs = require('fs');
const express = require('express');
const puppeteer = require('puppeteer');
const handlebars = require('handlebars');
const { generate } = require("otp-generator");
const { find } = require("../models/brand");


const order_details_get=async(req,res)=>{
    const _id=req.query._id
    const message=req.query.message

    let cancel=false,revise=false
    let order=await Order.findById(_id).populate('items.product')
    if(order.status=="Cancelled"){
        cancel=true
        //await Order.findByIdAndUpdate({_id},{cancel:true})
    }
    if(order.paytype=="Razorpay" && !order.razpay){
        revise = true
    }
    res.render('user/order-details',{revise:revise, order,title,message,cancel:cancel, cartnum, carttotal})
    console.log("order_details_get")

}

const order_list_get=async(req,res)=>{
    const order=await Order.find({u_id:req.session.user}).populate('items.product').sort({createdAt:-1})
    res.render('user/order-list',{order,title, cartnum, carttotal,orders:true})
}

const order_cancel_get=async(req,res)=>{
    const _id = req.query._id
    await Order.findOneAndUpdate({_id:_id},{status:"Cancelled",reqCancel:true})
    res.redirect(`order-details?message=Order+has+been+cancelled&_id=${_id}`)
    console.log("order_cancel_get")
    console.log(await Order.findOne({_id:_id}))

}

const orderInvoice=async (req, res) => {
        try {
            const {_id}=req.body
                const orderDetails = await Order.findOne
    
            // Read HTML invoice template
            const htmlTemplate = fs.readFileSync(path.join(__dirname, 'invoice_template.html'), 'utf-8');
    
            // Generate table rows for items
            let itemsHtml = '';
            for (const item of orderDetails.items) {
                itemsHtml += `
                    <tr>
                        <td>${item.name}</td>
                        <td>${item.quantity}</td>
                        <td>${item.price}</td>
                        <td>${item.quantity * item.price}</td>
                    </tr>
                `;
            }
    
            // Replace placeholders in the template with order details and items HTML
            const renderedHtml = htmlTemplate.replace('{{orderId}}', orderDetails.orderId)
                                             .replace('{{customerName}}', orderDetails.customerName)
                                             .replace('{{items}}', itemsHtml);
    
            // Launch Puppeteer
            const browser = await puppeteer.launch();
            const page = await browser.newPage();
    
            // Set content to rendered HTML
            await page.setContent(renderedHtml);
    
            // Generate PDF
            const pdfBuffer = await page.pdf({ format: 'A4' });
    
            // Close Puppeteer browser
            await browser.close();
    
            // Set response headers to trigger browser download
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', 'attachment; filename="invoice.pdf"');
    
            // Send PDF buffer to the client for download
            res.send(pdfBuffer);
        } catch (error) {
            console.error('Error generating PDF:', error);
            res.status(500).send('Internal Server Error');
        }

}

////////////////////////////// Admin Section \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\

const orders_get=async(req,res)=>{
    const order=await Order.find().populate('u_id').sort({ createdAt: -1 });
    res.render('admin/orders',{title,layout:'admin/layout',order})
}

const order_edit_get=async(req,res)=>{
    const _id=req.query._id
    const order = await Order.findById(_id).populate('u_id').populate('items.product')
    
    console.log(order)

    res.render('admin/order-edit',{title,order,layout:'admin/layout'})
    console.log("order_edit_get")
}

const order_edit_post=async(req,res)=>{
    const _id=req.body._id
    const notes=req.body.notes
    const status=req.body.status
    let orderUpdate=await Order.findOneAndUpdate({_id:_id},{notes:notes, status:status})

    if(status=='Refund Complete'){
        if(orderUpdate.delivered){
            walletRefund(_id)
            res.redirect(`order-edit?message=Order+updated&_id=${_id}`)


        }
        else if(!orderUpdate.delivered && orderUpdate.razpay){
            walletRefund(_id)
            res.redirect(`order-edit?message=Order+updated&_id=${_id}`)



        }
        else{

        }
        
    }
    orderUpdate=await Order.findOneAndUpdate({_id:_id},{notes:notes, status:status, refunded:true})
    
    console.log("order_edit_post")

}

async function walletRefund(_id){
    const order = await Order.findOne({_id:_id})
    const walletRefunding=await Wallet.findOne({u_id:order.u_id})
    walletRefunding.balance+=order.total
    action=[{
        credit:true,
        amount:order.total,
        current: walletRefunding.balance,
        o_id: _id
    }]
    walletRefunding.action=action
    await walletRefunding.save()
    return
}

const cancelOrder=async(req,res)=>{
    const {_id}=req.query
    const cancelling=await Order.findByIdAndDelete({_id:_id},{status:"Cancelled", cancel:true})

}


const orderList=(req,res)=>{
    res.render('admin/orders',{layout:'admin/layout'})
    console.log("orderList");
}
const filterFn=async(search,startDate,endDate,page,limit,sort)=>{
    if(!startDate){
        startDate=0
    }
    if(!endDate){
        endDate=Date.now()
    }
    if(!page){
        page=1
    }
    let skip=(page-1)*limit
    switch(sort){
        default: sorting={order_id:-1}
    }
    let findFn={name: { $regex: new RegExp(search, 'i') },createdAt:{$gte:startDate,$lte:endDate}};
    const count=await Order.countDocuments(findFn)
    const overall=await Order.find(findFn).populate('u_id')
    const orders=await Order.find(findFn).populate('u_id').sort(sorting).skip(skip).limit(limit);
    const subtotal = overall.reduce((acc, order) => acc + order.subtotal, 0);
    const discount = overall.reduce((acc, order) => acc + order.coupondiscount, 0);
    const total = overall.reduce((acc, order) => acc + order.total, 0);
    let pages=Math.ceil(count/limit)
    return {overall,orders,pages,page,count,subtotal,discount,total}

}

const orderFilter=async (req,res)=>{
    try{
        let {search,startDate,endDate,page,limit,sort}=req.body        
        res.json(await filterFn(search,startDate,endDate,page,limit,sort))
        console.log("orderFilter");

    }
    catch{
        res.status(500).json("Error occured")
    }

}

const generatePdf = async (req, res) => {
    try {
        let { search, startDate, endDate, page, limit, sort } = req.body;

        const { overall, subtotal, discount, total ,count} = await filterFn(search, startDate, endDate, page, limit, sort);
        const htmlContent = fs.readFileSync('./views/admin/order-list-pdf.hbs', 'utf8');
        const template = handlebars.compile(htmlContent);

        
        let tableContent = `
            <table class="table border my-5" style="font-size: 10px">
                <thead>
                    <tr class="bg-primary-subtle">
                        <th scope="col">No.</th>
                        <th scope="col">Name</th>
                        <th scope="col">Subtotal</th>
                        <th scope="col">Discount</th>
                        <th scope="col">Total</th>
                        <th scope="col">Status</th>
                        <th scope="col">Order Date</th>
                    </tr>
                </thead>
                <tbody>
        `;

        overall.forEach((item, index) => {
            tableContent += `
                <tr>
                <td>${item.order_id}</td>
                <td>${item.u_id.first_name} ${item.u_id.last_name}</td>
                <td>${item.subtotal}</td>
                <td>${item.coupondiscount}</td>
                <td>${item.total}</td>
                <td>${item.status}</td>
                <td>${dateConvert(item.createdAt)}</td>
                </tr>
            `;
        });

        tableContent += `
                </tbody>
            </table>
        `;
        const renderedHtml = template( {tableContent, subtotal, discount, total,count} );

        const browser = await puppeteer.launch();
        const paged = await browser.newPage();

        const marginOptions = {
            top: '1cm',
            bottom: '1cm',
            left: '1cm',
            right: '1cm'
        };

        await paged.setContent(renderedHtml);
        const pdfBuffer = await paged.pdf({
            format: 'A4',
            margin: marginOptions
        });

        await browser.close();

        res.setHeader('Content-Disposition', 'inline; filename="Sales Report"');
        res.setHeader('Content-Type', 'application/pdf');
        res.send(pdfBuffer);
    } catch (error) {
        console.error("Error generating PDF:", error);
        res.status(500).json({ error: "Error generating PDF" });
    }
};

const generateCsv=async(req,res)=>{
    
    try {
        let { search, startDate, endDate, page, limit, sort } = req.body;

        const { overall, subtotal, discount, total ,count} = await filterFn(search, startDate, endDate, page, limit, sort);
        console.log(1)
        // Define the path where you want to save the CSV file
        const csvFilePath = './overall.csv';

        // Define the CSV writer
        const csvWriter = createObjectCsvWriter({
            path: csvFilePath,
            header: [
                { id: 'order_id', title: 'Order ID' },
                { id: 'name', title: 'Name' },
                { id: 'subtotal', title: 'Subtotal' },
                { id: 'coupondiscount', title: 'Discount' },
                { id: 'total', title: 'Total' },
                { id: 'status', title: 'Status' },
                { id: 'createdAt', title: 'Order Date' }
            ]
        });

        // Write data to CSV file
        await csvWriter.writeRecords(overall);

        // Send the CSV file as response
        res.download(csvFilePath, 'overall.csv', (err) => {
            if (err) {
                console.error('Error sending file:', err);
                res.status(500).json({ error: 'Error sending file' });
            } else {
                // Remove the CSV file after it's been sent
                fs.unlinkSync(csvFilePath);
            }
        });
    } catch (error) {
        console.error('Error generating CSV:', error);
        res.status(500).json({ error: 'Error generating CSV' });
    }
}


module.exports={
    order_details_get,
    order_list_get,
    orders_get,
    order_cancel_get,
    order_edit_get,
    order_edit_post,
    orderInvoice,
    orderFilter,
    orderList,
    generatePdf,
    generateCsv,
    cancelOrder
}