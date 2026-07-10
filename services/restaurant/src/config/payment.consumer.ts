import { getChannel } from "./rabbitMQ.js";
import Order from "../models/OrderModel.js";

export const startPaymentConsumer = async () => {
    const channel = getChannel();

    channel.consume(process.env.PAYMENT_QUEUE!, async (msg) => {
        if (!msg) return;

        try {
            const event = JSON.parse(msg.content.toString());

            if (event.type !== "PAYMENT_SUCCESS") {
                channel.ack(msg);
                return;
            }

            const { orderId } = event.data;

            const order = await Order.findOneAndUpdate({
                _id: orderId,
                paymentStatus: { $ne: "paid" }
            },
                {
                    $set: {
                        paymentStatus: "paid",
                        status: "placed",
                    },
                    $unset: {
                        expiresAt: 1,
                    }
                },
                {
                    new: true
                })

                if(!order){
                    channel.ack(msg);
                    return;
                }

            console.log(`✅Payment successful for order ${orderId}. Order status updated to 'placed'.`);

            //socket work 

            channel.ack(msg);

        } catch (error) {
            console.error('❌ Error occurred while processing payment message:', error);
        }
    })
}
