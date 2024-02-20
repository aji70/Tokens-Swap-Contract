// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;
interface IERC20 {
    // function name() external view returns (string memory);
    // function symbol() external view returns (string memory);
    // function decimals() external view returns (uint8);
    // function totalSupply() external view returns (uint256);
    function balanceOf(address _owner) external view returns (uint256 balance);
    function transfer(address _to, uint256 _value) external returns (bool success);
    function transferFrom(address _from, address _to, uint256 _value) external returns (bool success);
    // function approve(address _spender, uint256 _value) external returns (bool success);
    // function allowance(address _owner, address _spender) external view returns (uint256 remaining);

    event Transfer(address indexed _from, address indexed _to, uint256 _value);
    event Approval(address indexed _owner, address indexed _spender, uint256 _value);
}

contract Swap {
    
    address ajidokwuToken;
    address saboToken;
    address public owner;
    uint public ratioAtoStableToken;
    uint public ratioBtoStableToken;

        event swapedSaboToAjidokwuSuccessful(uint amount, string msg, string msg1, uint am);
        event swapedAjidokwuToSaboSuccessful(uint amount, string msg, string msg1, uint am);

      constructor(address _ajidokwuToken, address _saboToken, uint rateA, uint rateB) {
        ajidokwuToken = _ajidokwuToken;
        saboToken = _saboToken;
        owner = msg.sender;
        setRateofAjidokwutoStableCoin(rateA);
        setRateofSabotoStableCoin(rateB);
      }

      function swapAjidokwutoSabo(uint256 _amountAjidokwu) external  {
        require(msg.sender != address(0), "Address zero detected");
        require(_amountAjidokwu > 0, "not a valid Amount to be swaped");
        require(IERC20(ajidokwuToken).balanceOf(address(this)) >= ratioAjidokwutoSabo(_amountAjidokwu), "Not Enough Liquidity for Swap");

        require(IERC20(ajidokwuToken).balanceOf(msg.sender) >= _amountAjidokwu, "Insufficient Funds");

        require(IERC20(ajidokwuToken).transferFrom(msg.sender, address(this), _amountAjidokwu), "failed to deposit");

         uint256 _stableTokenBal = ratioAjidokwutoSabo(_amountAjidokwu);

       
       require(IERC20(saboToken).transfer(msg.sender, _stableTokenBal), "transfer Failed");

       emit swapedSaboToAjidokwuSuccessful(_amountAjidokwu, "SABO", "to",  _stableTokenBal);
         
         
      }

      function swapSabotoAjidokwu(uint256 _amountSabo) external {
        require(msg.sender != address(0), "Address zero detected");
        require(_amountSabo > 0, "not a valid Amount to be swaped");
         require(IERC20(ajidokwuToken).balanceOf(address(this)) >= ratioSabotoAjidokwu(_amountSabo), "Not Enough Liquidity for Swap");

        require(IERC20(saboToken).balanceOf(msg.sender) >= _amountSabo, "Insufficient Funds");

        require(IERC20(saboToken).transferFrom(msg.sender, address(this), _amountSabo), "failed to deposit");

         uint256 _stableTokenBal = ratioSabotoAjidokwu(_amountSabo);

    
        
         IERC20(ajidokwuToken).transfer(msg.sender, _stableTokenBal);
         
         emit swapedAjidokwuToSaboSuccessful(_amountSabo, "AJI", "to",  _stableTokenBal);
         
      }


      function ratioAjidokwutoSabo(uint256 _amountAjidokwu) public view returns(uint256){
        require(msg.sender != address(0), "Address zero detected");
        uint256 _stableTokenBal = (_amountAjidokwu * ratioAtoStableToken) / ratioBtoStableToken;
        uint256 _newAmount = _stableTokenBal - (1  * _stableTokenBal / 100);
        return(_newAmount);
      }

       function ratioSabotoAjidokwu(uint256 _amountSabo) public view returns(uint256){
        require(msg.sender != address(0), "Address zero detected");
        uint256 _stableTokenBal = (_amountSabo * ratioBtoStableToken) / ratioAtoStableToken;
        uint256 _newAmount = _stableTokenBal - (1  * _stableTokenBal / 100);
        return(_newAmount);
      }


     function checkAjidokwuTokenBal(address _user) public view returns(uint256){
      require(msg.sender != address(0), "Address zero detected");
        uint256 bal = IERC20(ajidokwuToken).balanceOf(_user);
        return bal;
    }

       function checkSaboTokenBal(address _user) public view returns(uint256){
        require(msg.sender != address(0), "Address zero detected");
        uint256 bal = IERC20(saboToken).balanceOf(_user);
        return bal;
    }

    function checkContractAjidokwuTokenBal() public view  returns(uint256){
      require(msg.sender != address(0), "Address zero detected");
        uint256 bal = IERC20(ajidokwuToken).balanceOf(address(this));
        return bal;
    }

     function checkContractSaboTokenBal() public view returns(uint256){
      require(msg.sender != address(0), "Address zero detected");
        uint256 bal = IERC20(saboToken).balanceOf(address(this));
        return bal;
    }
    
    function setRateofAjidokwutoStableCoin(uint256 _rate) public  returns(uint256) {
      require(msg.sender != address(0), "Address zero detected");
      require(msg.sender == owner, "You do not have the authorization to set Rate");
      require(_rate != 0, "not a valid Rate");
        ratioAtoStableToken = _rate;
        return _rate;
    }

    function setRateofSabotoStableCoin(uint256 _rate) public  returns(uint256) {
      require(msg.sender != address(0), "Address zero detected");
      require(msg.sender == owner, "You do not have the authorization to set Rate");
      require(_rate != 0, "not a valid Rate");
        ratioBtoStableToken = _rate;
        return _rate;
    }


}


