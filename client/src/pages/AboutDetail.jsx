import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import AOS from "aos";
import "aos/dist/aos.css";
import "../css/AboutDetail.css";

const AboutDetail = () => {
  useEffect(() => {
    AOS.init({
      duration: 1000,
      once: true,
      easing: "ease-out-cubic",
    });
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="about-detail-page">
      {/* 1. HERO BANNER */}
      <section className="about-banner-section">
        <img
          src="https://madamelan.vn/storage/rin-108-mdl-web-pc-ve-chung-toi-landing-page-vie.jpg"
          alt="Về chúng tôi Banner"
          className="banner-img"
        />
      </section>

      {/* 2. TẦM NHÌN & SỨ MỆNH */}
      <section className="tam-nhin-su-menh-section">
        <div className="container">
          <div className="breadcrumbs">
            <Link to="/">Trang chủ</Link> / <span>Về chúng tôi</span>
          </div>

          <div className="content-center">
            <img
              src="https://madamelan.vn/storage/ve-chung-toi/tam-nhin-su-menh.png"
              alt="Tầm nhìn & Sứ mệnh"
              className="img-tam-nhin"
              data-aos="fade-in"
            />
            <div className="text-wrapper" data-aos="fade-up">
              <p>
                Với tầm nhìn hướng tới một cộng đồng gắn kết và bền vững, nhà
                hàng Madame Lân ra đời cùng sứ mệnh truyền cảm hứng bất tận về
                câu chuyện ẩm thực Việt Nam; đồng thời lan tỏa giá trị nhân văn
                sâu sắc của văn hóa ẩm thực Việt qua những bữa ăn trọn vẹn hương
                vị cùng khoảnh khắc của yêu thương và sẻ chia.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. CÂU CHUYỆN THƯƠNG HIỆU */}
      <section className="cau-chuyen-section">
        <div className="container">
          <div className="row align-items-center">
            <div className="col-img" data-aos="fade-right">
              <img
                src="https://madamelan.vn/storage/ve-chung-toi/tuong-madamelan-min.png"
                alt="Tượng Madame Lân"
              />
            </div>
            <div className="col-text" data-aos="fade-left">
              <h2 className="section-title">Câu chuyện thương hiệu</h2>
              <div className="story-content">
                <p>
                  Madame Lân là một người phụ nữ bình dị như bao người phụ nữ
                  Việt Nam khác. Mẹ Lân đã nuôi sáu người con khôn lớn trưởng
                  thành bằng mớ rau tươi hái từ vườn, những con cá tươi rói,
                  những con tôm nhảy tanh tách trong chiếc rá được trải lá tre
                  xanh ngắt. Những nguyên liệu và gia vị trong vườn nhà được chế
                  biến thành biết bao món ăn trọn vẹn hương vị, đầy ắp yêu thương
                  bằng niềm say mê ẩm thực Việt Nam được truyền lại từ bao thế
                  hệ. Bữa cơm nhà mẹ Lân cứ thế rộn rã tiếng cười trong sự đầm
                  ấm cùng hương vị không thể nào quên.
                </p>
                <p>
                  Ký ức về những món ăn và khoảnh khắc sum vầy đó đã trở thành
                  nguồn cảm hứng cho sự ra đời của thương hiệu Nhà hàng Madame
                  Lân. Với mong muốn lan tỏa giá trị nhân văn sâu sắc của văn
                  hóa ẩm thực Việt Nam, Madame Lân tin rằng, sự trọn vẹn trong
                  trải nghiệm ẩm thực có sức mạnh kết nối con người. Trọn vẹn
                  là khi câu chuyện ẩm thực Việt được người đầu bếp kể lại bằng
                  ngôn ngữ tươi mới trong từng món ăn; là sự chăm sóc ân cần và
                  năng lượng tích cực được truyền tải từ những người phục vụ; là
                  những giây phút quây quần bên nhau trong không gian ấm cúng,
                  thân mật. Khi những sắc thái đó hội tụ cũng chính là lúc trải
                  nghiệm ẩm thực thăng hoa. Và hành trình viết nên những câu
                  chuyện về ẩm thực Việt của Madame Lân đã bắt đầu…
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. TRIẾT LÝ THƯƠNG HIỆU */}
      <section className="triet-li-section">
        <div className="container">
          <h2 className="triet-li-title" data-aos="fade-up">
            Triết lý thương hiệu
          </h2>
          <div className="triet-li-intro" data-aos="fade-up">
            <p>
              Madame Lân mang đến trải nghiệm ẩm thực bằng triết lý và niềm tin
              về tính "<strong>Trọn Vẹn</strong>".
            </p>
            <p>
              Tinh hoa văn hóa ẩm thực Việt Nam mang nhiều dấu ấn độc đáo, phản
              ánh đời sống tinh thần cũng như quan niệm sống nhân văn của người
              Việt từ bao thế hệ đã trở thành nguồn cảm hứng cho triết lý về tính
              "<strong>Trọn Vẹn</strong>" trong trải nghiệm ẩm thực của Madame
              Lân.
            </p>
          </div>

          <div className="triet-li-grid" data-aos="fade-up" data-aos-delay="200">
            {/* Cột 1 */}
            <div className="triet-li-card">
              <div className="card-img-wrapper">
                <img
                  src="https://madamelan.vn/storage/222309-mdl-am-thuc-web.jpg"
                  alt="Ẩm thực"
                />
              </div>
              <h3>Ẩm thực</h3>
              <p>
                Ẩm thực Việt Nam mang tính kế thừa và tiếp biến trong tiến trình
                lịch sử của văn hóa, do đó trải nghiệm ẩm thực "
                <strong>Trọn Vẹn</strong>" là sáng tạo trong chế biến nhưng vẫn
                tôn trọng những nguyên lý đã được đúc kết ngàn đời nhằm lưu giữ
                hương vị truyền thống.
              </p>
            </div>

            {/* Cột 2 */}
            <div className="triet-li-card">
              <div className="card-img-wrapper">
                <img
                  src="https://madamelan.vn/storage/222309-mdl-con-nguoi-2-web.jpg"
                  alt="Con người"
                />
              </div>
              <h3>Con người</h3>
              <p>
                Tính "<strong>Trọn Vẹn</strong>" đến từ sự chu đáo và tận tình
                của người đầu bếp, người phục vụ; là dòng chảy năng lượng được
                tạo ra từ lòng đam mê và nhiệt huyết của những con người Madame
                Lân.
              </p>
            </div>

            {/* Cột 3 */}
            <div className="triet-li-card">
              <div className="card-img-wrapper">
                <img
                  src="https://madamelan.vn/storage/222309-mdl-khong-gian-web.jpg"
                  alt="Không gian"
                />
              </div>
              <h3>Không gian</h3>
              <p>
                Với kiến trúc mang nét giao thoa tinh tế giữa xưa và nay cùng
                không gian chan hòa thiên nhiên, Madame Lân mang đến ý niệm về
                tính "<strong>Trọn Vẹn</strong>" từ bầu không khí ấm áp và gần
                gũi, khơi gợi những xúc cảm gắn kết và sẻ chia trong từng khoảnh
                khắc.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AboutDetail;