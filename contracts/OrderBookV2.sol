// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract OrderBookV2 is ReentrancyGuard {
    using Counters for Counters.Counter;
    Counters.Counter private _orderIds;

    address constant public ETH_ADDRESS = address(0);

    struct Order {
        uint256 id;
        address maker;
        address tokenIn;
        address tokenOut;
        uint256 amountIn;
        uint256 amountOut;
        bool active;
        uint256 timestamp;
    }

    // Mapping from orderId to Order
    mapping(uint256 => Order) public orders;
    
    // Track active orders for efficient querying
    uint256[] private activeOrderIds;
    mapping(uint256 => uint256) private activeOrderIndex; // orderId => index in activeOrderIds
    
    // Track orders by token pairs
    mapping(address => mapping(address => uint256[])) private ordersByPair; // tokenIn => tokenOut => orderIds
    
    // Events
    event OrderCreated(
        uint256 indexed orderId,
        address indexed maker,
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint256 amountOut
    );
    
    event OrderFilled(
        uint256 indexed orderId,
        address indexed maker,
        address indexed taker,
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint256 amountOut
    );
    
    event OrderCancelled(uint256 indexed orderId, address indexed maker);

    // Function to create an order with ETH as payment
    function createOrderWithETH(
        address tokenOut,
        uint256 amountOut
    ) external payable nonReentrant returns (uint256) {
        require(tokenOut != ETH_ADDRESS, "Cannot exchange ETH for ETH");
        require(msg.value > 0, "Must send ETH");

        // Create order
        _orderIds.increment();
        uint256 orderId = _orderIds.current();
        
        orders[orderId] = Order({
            id: orderId,
            maker: msg.sender,
            tokenIn: ETH_ADDRESS,
            tokenOut: tokenOut,
            amountIn: msg.value,
            amountOut: amountOut,
            active: true,
            timestamp: block.timestamp
        });

        // Add to active orders
        activeOrderIds.push(orderId);
        activeOrderIndex[orderId] = activeOrderIds.length - 1;
        
        // Add to token pair tracking
        ordersByPair[ETH_ADDRESS][tokenOut].push(orderId);

        emit OrderCreated(orderId, msg.sender, ETH_ADDRESS, tokenOut, msg.value, amountOut);
        return orderId;
    }

    // Function to create an order to receive ETH
    function createOrderForETH(
        address tokenIn,
        uint256 amountIn,
        uint256 ethAmount
    ) external nonReentrant returns (uint256) {
        require(tokenIn != ETH_ADDRESS, "Cannot exchange ETH for ETH");
        require(ethAmount > 0, "Invalid ETH amount");

        // Transfer tokens to contract
        IERC20(tokenIn).transferFrom(msg.sender, address(this), amountIn);

        // Create order
        _orderIds.increment();
        uint256 orderId = _orderIds.current();
        
        orders[orderId] = Order({
            id: orderId,
            maker: msg.sender,
            tokenIn: tokenIn,
            tokenOut: ETH_ADDRESS,
            amountIn: amountIn,
            amountOut: ethAmount,
            active: true,
            timestamp: block.timestamp
        });

        // Add to active orders
        activeOrderIds.push(orderId);
        activeOrderIndex[orderId] = activeOrderIds.length - 1;
        
        // Add to token pair tracking
        ordersByPair[tokenIn][ETH_ADDRESS].push(orderId);

        emit OrderCreated(orderId, msg.sender, tokenIn, ETH_ADDRESS, amountIn, ethAmount);
        return orderId;
    }

    // Internal function to remove an order from active orders
    function _removeFromActive(uint256 orderId) internal {
        uint256 index = activeOrderIndex[orderId];
        uint256 lastOrderId = activeOrderIds[activeOrderIds.length - 1];
        
        // Move the last item into the position being deleted
        activeOrderIds[index] = lastOrderId;
        activeOrderIndex[lastOrderId] = index;
        
        // Remove the last element
        activeOrderIds.pop();
        delete activeOrderIndex[orderId];
    }

    // Function to fill an order
    function fillOrder(uint256 orderId) external payable nonReentrant {
        Order storage order = orders[orderId];
        require(order.active, "Order not active");
        require(order.maker != msg.sender, "Cannot fill own order");

        if (order.tokenOut == ETH_ADDRESS) {
            // Filling an order where taker pays with ETH
            require(msg.value == order.amountOut, "Incorrect ETH amount");
            
            // Transfer tokens from contract to taker
            IERC20(order.tokenIn).transfer(msg.sender, order.amountIn);
            
            // Transfer ETH to maker
            (bool sent, ) = order.maker.call{value: msg.value}("");
            require(sent, "Failed to send ETH");
        } else if (order.tokenIn == ETH_ADDRESS) {
            // Filling an order where maker paid with ETH
            // Transfer tokens from taker to maker
            IERC20(order.tokenOut).transferFrom(msg.sender, order.maker, order.amountOut);
            
            // Transfer ETH from contract to taker
            (bool sent, ) = msg.sender.call{value: order.amountIn}("");
            require(sent, "Failed to send ETH");
        } else {
            // Case where both tokens are ERC20 (e.g., USDC or other tokens)
            require(msg.value == 0, "ETH not required for this order");
            
            // Transfer tokenOut from taker to maker
            IERC20(order.tokenOut).transferFrom(msg.sender, order.maker, order.amountOut);
            
            // Transfer tokenIn from contract to taker
            IERC20(order.tokenIn).transfer(msg.sender, order.amountIn);
        }

        // Mark order as filled and remove from active orders
        order.active = false;
        _removeFromActive(orderId);

        emit OrderFilled(
            orderId,
            order.maker,
            msg.sender,
            order.tokenIn,
            order.tokenOut,
            order.amountIn,
            order.amountOut
        );
    }

    // Function to cancel an order
    function cancelOrder(uint256 orderId) external nonReentrant {
        Order storage order = orders[orderId];
        require(order.active, "Order not active");
        require(order.maker == msg.sender, "Not order maker");

        if (order.tokenIn == ETH_ADDRESS) {
            // Return ETH to maker
            (bool sent, ) = msg.sender.call{value: order.amountIn}("");
            require(sent, "Failed to send ETH");
        } else {
            // Return tokens to maker
            IERC20(order.tokenIn).transfer(msg.sender, order.amountIn);
        }

        // Mark order as inactive and remove from active orders
        order.active = false;
        _removeFromActive(orderId);

        emit OrderCancelled(orderId, msg.sender);
    }

    // Function to get order details
    function getOrder(uint256 orderId) external view returns (Order memory) {
        return orders[orderId];
    }

    // Function to get all active order IDs
    function getActiveOrders() external view returns (uint256[] memory) {
        return activeOrderIds;
    }

    // Function to get active orders for a specific token pair
    function getOrdersByPair(address tokenIn, address tokenOut) external view returns (uint256[] memory) {
        uint256[] memory pairOrders = ordersByPair[tokenIn][tokenOut];
        uint256 activeCount = 0;
        
        // First count active orders
        for (uint256 i = 0; i < pairOrders.length; i++) {
            if (orders[pairOrders[i]].active) {
                activeCount++;
            }
        }
        
        // Create result array with only active orders
        uint256[] memory activeOrders = new uint256[](activeCount);
        uint256 activeIndex = 0;
        
        for (uint256 i = 0; i < pairOrders.length && activeIndex < activeCount; i++) {
            if (orders[pairOrders[i]].active) {
                activeOrders[activeIndex] = pairOrders[i];
                activeIndex++;
            }
        }
        
        return activeOrders;
    }

    // Function to get the total number of orders ever created
    function getTotalOrders() external view returns (uint256) {
        return _orderIds.current();
    }

    // Function to get the number of active orders
    function getActiveOrderCount() external view returns (uint256) {
        return activeOrderIds.length;
    }

    // Function to receive ETH
    receive() external payable {}
}
