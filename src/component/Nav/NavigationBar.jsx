import React from 'react';
import './NavigationBar.css';  // Ensure the CSS file is correctly linked

const NavigationBar = () => {
  return (
    <nav className="container">
      <div className="logo">
        <img src="/images/brand_logo.png" alt="logo" />
      </div>
      <div class="tab-container">
        <input type="radio" name="tab" id="tab1" class="tab tab--1" />
        <label class="tab_label" for="tab1">Profile</label>

        <input type="radio" name="tab" id="tab2" class="tab tab--2" />
        <label class="tab_label" for="tab2">Settings</label>

        <input type="radio" name="tab" id="tab3" class="tab tab--3" />
        <label class="tab_label" for="tab3">Notifications</label>

        <input type="radio" name="tab" id="tab4" class="tab tab--4" />
        <label class="tab_label" for="tab4">Notifications</label>

        <div class="indicator"></div>
      </div>


      <div className="nav-btn">
          <button class="button"></button>
        </div>
    </nav>
  );
}

export default NavigationBar;
