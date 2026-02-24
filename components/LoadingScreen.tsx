'use client';

import { motion, AnimatePresence, Variants } from 'framer-motion';
import { useEffect, useState } from 'react';

interface LoadingScreenProps {
    onComplete?: () => void;
    duration?: number;
}

export default function LoadingScreen({
    onComplete,
    duration = 13000,
}: LoadingScreenProps) {
    const [isVisible, setIsVisible] = useState(true);
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
        const timer = setTimeout(() => {
            setIsVisible(false);
            setTimeout(() => onComplete?.(), 500);
        }, duration);
        return () => clearTimeout(timer);
    }, [duration, onComplete]);

    if (!isMounted) return null;

    // Timeline:
    // 0s - 3.5s: Owl Construction (Draws)
    // 3.5s - 5.5s: Owl Move & Shrink
    // 5.5s - 8.5s: Text Construction (Draws Lines)
    // 8.5s - 9.5s: Full Fill (Color fills in)
    // 9.5s - 13.0s: Hold   

    const owlGroupVariants: Variants = {
        initial: {
            scale: 3.2,
            x: 884.5, // Center owl horizontally in SVG viewBox (1194.5 - 310)
            y: 0,  // Center owl vertically in SVG viewBox
        },
        move: {
            scale: 1,
            x: 0,
            y: 0,
            transition: {
                delay: 3.5,
                duration: 2.0,
                ease: 'easeInOut'
            }
        }
    };

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    className='loading-screen'
                    initial={{ opacity: 1 }}
                    exit={{ opacity: 0, transition: { duration: 1.0 } }}
                >
                    <svg
                        xmlns='http://www.w3.org/2000/svg'
                        viewBox='0 0 2389 694'
                        className='logo-svg-full'
                        style={{
                            width: '90%',
                            maxWidth: '1400px',
                            height: 'auto',
                            overflow: 'visible'
                        }}
                    >
                        {/* Owl Group - Centered Animation */}
                        <motion.g
                            variants={owlGroupVariants}
                            initial='initial'
                            animate='move'
                            style={{ transformOrigin: '310px 270px' }}
                        >
                            {/* Owl Paths - Random Line Drawing */}

                            <motion.path
                                key="owl-0"
                                d="M220.69 120.2C231.718 120.366 234.391 123.831 243.915 127.497C245.234 128.005 250.518 122.144 253.398 121.407C257.311 124.394 253.924 135.701 252.32 139.685L254.625 145.456C251.757 143.379 248.693 141.348 245.76 139.344C239.146 142.074 228.021 154.174 222.473 159.631C218.422 161.976 203.54 139.75 196.188 140.5C193.093 140.816 192.113 142.308 189.659 144.491L189.047 144.45C188.396 133.968 186.876 130.094 189.128 119.952C199.466 129.881 199.025 128.113 211.074 122.259C212.413 121.609 218.819 120.544 220.69 120.2Z"
                                transform="scale(1.86641 1.86559)"
                                stroke="#f4e1ceff"   /* Greek Orange Stroke */
                                strokeWidth="2"
                                fill="#f4e1ceff"     /* Greek Cream Fill */
                                initial={{ pathLength: 0, fillOpacity: 0 }}
                                animate={{ pathLength: 1, fillOpacity: 1 }}
                                transition={{
                                    pathLength: { delay: 0.7621133667911443, duration: 2.5, ease: "easeInOut" },
                                    fillOpacity: { delay: 9.0, duration: 1.0 }
                                }}
                            />
                            <motion.path
                                key="owl-1"
                                d="M246.752 142.523L247.141 142.893C247.794 144.918 247.39 149.226 247.286 151.54C239.172 161.354 235.939 154.916 228.482 163.97C223.749 158.553 238.449 147.157 242.536 145.322C243.607 144.841 245.694 143.222 246.752 142.523Z"
                                transform="scale(1.86641 1.86559)"
                                stroke="#f4e1ceff"   /* Greek Orange Stroke */
                                strokeWidth="2"
                                fill="#f4e1ceff"     /* Greek Cream Fill */
                                initial={{ pathLength: 0, fillOpacity: 0 }}
                                animate={{ pathLength: 1, fillOpacity: 1 }}
                                transition={{
                                    pathLength: { delay: 1.43147329221583, duration: 2.5, ease: "easeInOut" },
                                    fillOpacity: { delay: 9.0, duration: 1.0 }
                                }}
                            />
                            <motion.path
                                key="owl-2"
                                d="M195.558 141.698C202.828 149.72 214.418 149.568 214.774 164.043C213.841 163.543 212.524 162.268 212.065 161.387C210.029 157.48 200.084 157.224 197.299 154.472C194.733 151.938 195.299 145.237 195.558 141.698Z"
                                transform="scale(1.86641 1.86559)"
                                stroke="#f4e1ceff"   /* Greek Orange Stroke */
                                strokeWidth="2"
                                fill="#f4e1ceff"     /* Greek Orange Fill */
                                initial={{ pathLength: 0, fillOpacity: 0 }}
                                animate={{ pathLength: 1, fillOpacity: 1 }}
                                transition={{
                                    pathLength: { delay: 0.6102277849411286, duration: 2.5, ease: "easeInOut" },
                                    fillOpacity: { delay: 9.0, duration: 1.0 }
                                }}
                            />
                            <motion.path
                                key="text-0"
                                d="M336.851 111.759L337.558 112.843C337.691 119.134 336.836 126.314 335.371 132.444C323.466 182.249 272.255 191.729 233.404 214.637C234.316 221.437 235.757 226.657 236.502 234.168C233.315 228.807 230.103 223.933 226.661 218.75C208.629 228.924 196.259 244.639 187.5 263.001C192.735 236.408 192.309 227.594 208.213 203.316C192.271 193.622 179.082 188.864 162.316 181.583C129.312 166.836 117.34 152.677 114.887 116.593C132.043 142.673 168.889 143.603 192.974 160.26C205.691 169.055 211.33 175.79 220.568 187.882C232.001 174.6 246.195 164.193 262.053 156.815C290.267 143.69 317.206 138.392 336.851 111.759Z"
                                transform="scale(1.86641 1.86559)"
                                stroke="#f4e1ceff"   /* Greek Orange Stroke */
                                strokeWidth="2"
                                fill="#f4e1ceff"   /* Greek Cream Fill */
                                initial={{ pathLength: 0, fillOpacity: 0 }}
                                animate={{ pathLength: 1, fillOpacity: 1 }}
                                transition={{
                                    pathLength: { delay: 0.6102277849411286, duration: 2.5, ease: "easeInOut" },
                                    fillOpacity: { delay: 9.0, duration: 1.0 }
                                }}
                            />
                        </motion.g>

                        {/* Text Group - Line Following Animation */}
                        <motion.g>


                            <motion.path
                                key="text-1"
                                d="M346.32 150.336C351.647 150.404 355.782 150.365 361.089 149.999C360.771 159.003 360.69 168.015 360.845 177.024C363.464 176.874 366.17 176.433 368.259 177.918C367.618 184.843 372.419 183.537 377.826 183.732C381.453 183.863 385.714 183.416 389.387 183.214L389.479 192.684C381.319 192.199 369.579 192.596 361.188 192.69C360.84 201.945 360.875 210.594 360.954 219.857C355.418 219.576 350.935 219.76 345.382 219.996C344.402 203.691 345.159 169.597 345.302 151.665C345.703 151.142 346.042 150.699 346.32 150.336Z"
                                transform="scale(1.86641 1.86559)"
                                stroke="#f4e1ceff"   /* Greek Orange Stroke */
                                strokeWidth="1.5"
                                fill="#f4e1ceff"     /* Greek Cream Fill */
                                initial={{ pathLength: 0, fillOpacity: 0, strokeOpacity: 1 }}
                                animate={{
                                    pathLength: 1,
                                    fillOpacity: 1,
                                    strokeOpacity: 0
                                }}
                                transition={{
                                    pathLength: { delay: 5.5 + 0.05, duration: 2.5, ease: "easeInOut" },
                                    fillOpacity: { delay: 8.5, duration: 1.0 },
                                    strokeOpacity: { delay: 9.5, duration: 0.5 }
                                }}
                            />
                            <motion.path
                                key="text-2"
                                d="M856.369 148.612C860.98 150.266 867.151 153.121 871.778 155.098C871.956 160.687 871.53 166.917 871.332 172.513C870.737 189.328 869.049 200.015 887.172 206.086L888.068 212.899C897.755 211.478 898.348 211.638 906.606 206.374C908.766 208.088 910.259 209.193 912.065 211.288L911.927 212.511C898.231 223.788 877.737 223.499 865.446 210.314C861.395 205.946 858.55 200.598 857.192 194.797C855.354 187.219 856.035 157.616 856.369 148.612Z"
                                transform="scale(1.86641 1.86559)"
                                stroke="#f4e1ceff"   /* Greek Orange Stroke */
                                strokeWidth="1.5"
                                fill="#f4e1ceff"     /* Greek Cream Fill */
                                initial={{ pathLength: 0, fillOpacity: 0, strokeOpacity: 1 }}
                                animate={{
                                    pathLength: 1,
                                    fillOpacity: 1,
                                    strokeOpacity: 0
                                }}
                                transition={{
                                    pathLength: { delay: 5.5 + 0.1, duration: 2.5, ease: "easeInOut" },
                                    fillOpacity: { delay: 8.5, duration: 1.0 },
                                    strokeOpacity: { delay: 9.5, duration: 0.5 }
                                }}
                            />
                            <motion.path
                                key="text-3"
                                d="M616.718 146.369L638.169 146.243C630.278 153.729 621.486 163.218 613.865 171.135C610.586 174.532 607.873 177.198 604.358 180.347C606.808 182.823 621.66 197.165 621.843 198.867C620.023 199.931 615.824 199.329 614.434 198.143C607.795 192.482 599.489 183.743 593.547 177.748C588.409 177.853 582.645 177.669 577.458 177.619C576.984 167.519 577.313 156.18 577.428 145.965C582.169 148.29 588.116 150.577 593.076 152.618C593.012 158.42 592.992 164.223 593.016 170.026C597.397 164.57 611.184 151.337 616.718 146.369Z"
                                transform="scale(1.86641 1.86559)"
                                stroke="#f4e1ceff"   /* Greek Orange Stroke */
                                strokeWidth="1.5"
                                fill="#f4e1ceff"     /* Greek Cream Fill */
                                initial={{ pathLength: 0, fillOpacity: 0, strokeOpacity: 1 }}
                                animate={{
                                    pathLength: 1,
                                    fillOpacity: 1,
                                    strokeOpacity: 0
                                }}
                                transition={{
                                    pathLength: { delay: 5.5 + 0.15000000000000002, duration: 2.5, ease: "easeInOut" },
                                    fillOpacity: { delay: 8.5, duration: 1.0 },
                                    strokeOpacity: { delay: 9.5, duration: 0.5 }
                                }}
                            />
                            <motion.path
                                key="text-4"
                                d="M760.51 146.33L781.615 146.263C770.882 157.547 758.744 169.334 747.694 180.431C751.062 184.124 764.278 195.136 764.252 199.069C759.122 201.68 751.395 192.368 748.337 189.208C744.626 185.533 741 181.773 737.46 177.933C732.096 177.7 726.727 177.609 721.358 177.661C721.121 167.241 721.069 156.818 721.204 146.397C725.981 148.549 732.074 150.814 737.02 152.813C736.879 158.352 736.946 164.174 736.923 169.737C741.918 164.226 754.913 150.643 760.51 146.33Z"
                                transform="scale(1.86641 1.86559)"
                                stroke="#f4e1ceff"   /* Greek Orange Stroke */
                                strokeWidth="1.5"
                                fill="#f4e1ceff"     /* Greek Cream Fill */
                                initial={{ pathLength: 0, fillOpacity: 0, strokeOpacity: 1 }}
                                animate={{
                                    pathLength: 1,
                                    fillOpacity: 1,
                                    strokeOpacity: 0
                                }}
                                transition={{
                                    pathLength: { delay: 5.5 + 0.2, duration: 2.5, ease: "easeInOut" },
                                    fillOpacity: { delay: 8.5, duration: 1.0 },
                                    strokeOpacity: { delay: 9.5, duration: 0.5 }
                                }}
                            />
                            <motion.path
                                key="text-5"
                                d="M460.336 143.046C462.171 144.938 484.146 194.411 486.541 200.136C482.738 200.151 455.893 200.523 454.622 199.505C455.223 196.504 455.915 195.841 458.604 195.085L467.936 195.744C465.575 190.735 462.175 184.006 460.563 178.889C458.966 183.344 458.382 184.646 455.947 188.755C450.311 188.586 444.886 188.642 439.247 188.708L460.336 143.046Z"
                                transform="scale(1.86641 1.86559)"
                                stroke="#f0ddc9ff"   /* Greek Cream Stroke */
                                strokeWidth="1.5"
                                fill="#f0ddc9ff"     /* Greek Cream Fill */
                                initial={{ pathLength: 0, fillOpacity: 0, strokeOpacity: 1 }}
                                animate={{
                                    pathLength: 1,
                                    fillOpacity: 1,
                                    strokeOpacity: 0
                                }}
                                transition={{
                                    pathLength: { delay: 5.5 + 0.25, duration: 2.5, ease: "easeInOut" },
                                    fillOpacity: { delay: 8.5, duration: 1.0 },
                                    strokeOpacity: { delay: 9.5, duration: 0.5 }
                                }}
                            />
                            <motion.path
                                key="text-6"
                                d="M394.384 147.526C399.198 147.631 404.308 147.486 409.147 147.42C408.165 169.395 408.995 197.133 409.187 219.501C406.133 218.655 397.607 214.825 394.29 213.427C393.767 202.525 393.98 190.082 393.937 179.06C388.513 179.091 376.859 179.904 372.588 176.763L372.475 175.655C375.644 172.265 389.446 173.131 394.315 173.184C393.945 164.635 393.967 156.073 394.384 147.526Z"
                                transform="scale(1.86641 1.86559)"
                                stroke="#f0ddc9ff"   /* Greek Cream Stroke */
                                strokeWidth="1.5"
                                fill="#f0ddc9ff"     /* Greek Cream Fill */
                                initial={{ pathLength: 0, fillOpacity: 0, strokeOpacity: 1 }}
                                animate={{
                                    pathLength: 1,
                                    fillOpacity: 1,
                                    strokeOpacity: 0
                                }}
                                transition={{
                                    pathLength: { delay: 5.5 + 0.30000000000000004, duration: 2.5, ease: "easeInOut" },
                                    fillOpacity: { delay: 8.5, duration: 1.0 },
                                    strokeOpacity: { delay: 9.5, duration: 0.5 }
                                }}
                            />
                            <motion.path
                                key="text-7"
                                d="M530.643 147.712C531.871 147.537 533.108 147.437 534.348 147.412C546.056 147.198 553.274 150.737 561.501 158.634C557.719 161.958 553.977 165.326 550.274 168.737C536.489 156.697 520.337 162.23 516.035 179.971C515.797 185.371 516.472 187.802 519.047 192.427C516.159 194.576 513.368 196.971 510.603 199.283C506.19 191.535 506.528 189.437 505.376 180.697C505.107 178.658 503.181 180.527 500.959 179.341C500.229 174.307 503.419 166.916 506.277 162.887C512.963 153.456 519.807 149.829 530.643 147.712Z"
                                transform="scale(1.86641 1.86559)"
                                stroke="#f0ddc9ff"   /* Greek Cream Stroke */
                                strokeWidth="1.5"
                                fill="#f0ddc9ff"     /* Greek Cream Fill */
                                initial={{ pathLength: 0, fillOpacity: 0, strokeOpacity: 1 }}
                                animate={{
                                    pathLength: 1,
                                    fillOpacity: 1,
                                    strokeOpacity: 0
                                }}
                                transition={{
                                    pathLength: { delay: 5.5 + 0.35000000000000003, duration: 2.5, ease: "easeInOut" },
                                    fillOpacity: { delay: 8.5, duration: 1.0 },
                                    strokeOpacity: { delay: 9.5, duration: 0.5 }
                                }}
                            />
                            <motion.path
                                key="text-8"
                                d="M719.294 182.204C724.396 182.152 729.118 181.958 734.173 182.726C739.967 187.828 749.624 198.157 755.182 203.981C758.616 203.867 761.325 204.219 764.704 204.595C769.104 208.344 775.317 215.378 780.017 219.774C773.736 219.554 759.698 220.878 755.661 217.702C748.824 210.206 740.944 202.993 733.825 195.482L733.773 219.978C728.455 219.75 723.586 219.884 718.263 220.021C717.801 208.476 718.04 195.984 718.174 184.375C718.191 182.912 718.212 183.042 719.294 182.204Z"
                                transform="scale(1.86641 1.86559)"
                                stroke="#f0ddc9ff"   /* Greek Cream Stroke */
                                strokeWidth="1.5"
                                fill="#f0ddc9ff"     /* Greek Cream Fill */
                                initial={{ pathLength: 0, fillOpacity: 0, strokeOpacity: 1 }}
                                animate={{
                                    pathLength: 1,
                                    fillOpacity: 1,
                                    strokeOpacity: 0
                                }}
                                transition={{
                                    pathLength: { delay: 5.5 + 0.4, duration: 2.5, ease: "easeInOut" },
                                    fillOpacity: { delay: 8.5, duration: 1.0 },
                                    strokeOpacity: { delay: 9.5, duration: 0.5 }
                                }}
                            />
                            <motion.path
                                key="text-9"
                                d="M574.969 182.184C582.999 182.123 589.498 181.031 595.708 187.209C601.118 192.59 606.342 198.389 611.558 203.945C614.697 203.888 617.984 204.279 621.121 204.582C624.59 207.473 633.102 216.546 636.226 219.914C631.195 219.65 616.029 220.441 613.069 218.311L590.61 195.853L590.537 219.754C584.955 219.63 580.453 219.498 574.907 219.981C574.807 214.221 574.005 185.662 574.969 182.184Z"
                                transform="scale(1.86641 1.86559)"
                                stroke="#f0ddc9ff"   /* Greek Cream Stroke */
                                strokeWidth="1.5"
                                fill="#f0ddc9ff"     /* Greek Cream Fill */
                                initial={{ pathLength: 0, fillOpacity: 0, strokeOpacity: 1 }}
                                animate={{
                                    pathLength: 1,
                                    fillOpacity: 1,
                                    strokeOpacity: 0
                                }}
                                transition={{
                                    pathLength: { delay: 5.5 + 0.45, duration: 2.5, ease: "easeInOut" },
                                    fillOpacity: { delay: 8.5, duration: 1.0 },
                                    strokeOpacity: { delay: 9.5, duration: 0.5 }
                                }}
                            />
                            <motion.path
                                key="text-10"
                                d="M682.929 162.315C686.052 162.538 690.066 162.272 693.263 162.149C693.123 167.195 692.387 182.499 693.457 186.605C694.714 186.857 695.796 186.971 697.068 187.11C701.859 193.554 691.385 209.66 685.352 213.573C676.147 219.543 669.541 220.977 658.812 219.428C653.172 218.8 648.205 215.227 643.736 212.05C645.197 211.263 655.292 206.414 656.269 206.367C689.391 204.759 681.582 187.782 682.929 162.315Z"
                                transform="scale(1.86641 1.86559)"
                                stroke="#f0ddc9ff"   /* Greek Cream Stroke */
                                strokeWidth="1.5"
                                fill="#f0ddc9ff"     /* Greek Cream Fill */
                                initial={{ pathLength: 0, fillOpacity: 0, strokeOpacity: 1 }}
                                animate={{
                                    pathLength: 1,
                                    fillOpacity: 1,
                                    strokeOpacity: 0
                                }}
                                transition={{
                                    pathLength: { delay: 5.5 + 0.5, duration: 2.5, ease: "easeInOut" },
                                    fillOpacity: { delay: 8.5, duration: 1.0 },
                                    strokeOpacity: { delay: 9.5, duration: 0.5 }
                                }}
                            />
                            <motion.path
                                key="text-11"
                                d="M792.498 147.824C797.678 150.029 802.873 152.197 808.083 154.33C807.564 169.257 807.786 185.12 808.057 200.058C812.462 200.206 817.299 199.019 820.417 201.264C821.517 202.748 821.154 204.769 821.064 206.676C812.245 206.987 801.56 206.698 792.476 206.805C791.303 191.428 791.171 162.862 792.498 147.824Z"
                                transform="scale(1.86641 1.86559)"
                                stroke="#f0ddc9ff"   /* Greek Cream Stroke */
                                strokeWidth="1.5"
                                fill="#f0ddc9ff"     /* Greek Cream Fill */
                                initial={{ pathLength: 0, fillOpacity: 0, strokeOpacity: 1 }}
                                animate={{
                                    pathLength: 1,
                                    fillOpacity: 1,
                                    strokeOpacity: 0
                                }}
                                transition={{
                                    pathLength: { delay: 5.5 + 0.55, duration: 2.5, ease: "easeInOut" },
                                    fillOpacity: { delay: 8.5, duration: 1.0 },
                                    strokeOpacity: { delay: 9.5, duration: 0.5 }
                                }}
                            />
                            <motion.path
                                key="text-12"
                                d="M435.358 193.152C440.575 193.364 446.575 193.245 451.853 193.263C449.996 197.16 448.23 201.101 446.559 205.082C458.597 205.043 470.634 205.105 482.671 205.269C484.027 207.474 485.696 211.457 486.818 213.929C482.173 215.864 477.555 217.862 472.964 219.922C472.088 217.999 471.673 217.052 470.418 215.28C465.546 214.437 447.874 214.993 441.982 215.056C440.792 217.353 440.14 219.082 437.307 219.484C432.666 220.143 427.677 219.76 422.912 219.813C424.461 215.601 432.967 196.366 435.358 193.152Z"
                                transform="scale(1.86641 1.86559)"
                                stroke="#f0ddc9ff"   /* Greek Cream Stroke */
                                strokeWidth="1.5"
                                fill="#f0ddc9ff"     /* Greek Cream Fill */
                                initial={{ pathLength: 0, fillOpacity: 0, strokeOpacity: 1 }}
                                animate={{
                                    pathLength: 1,
                                    fillOpacity: 1,
                                    strokeOpacity: 0
                                }}
                                transition={{
                                    pathLength: { delay: 5.5 + 0.6000000000000001, duration: 2.5, ease: "easeInOut" },
                                    fillOpacity: { delay: 8.5, duration: 1.0 },
                                    strokeOpacity: { delay: 9.5, duration: 0.5 }
                                }}
                            />
                            <motion.path
                                key="text-13"
                                d="M906.166 148.245L920.048 148.209C919.872 166.215 923.578 191.302 913.985 206.234C912.076 204.613 908.243 200.402 906.27 199.748L905.458 200.556C902.929 202.984 896.034 207.845 892.447 207.189L891.918 206.273C902.858 196.668 906.753 197.577 906.224 181.216C905.888 170.826 906.118 158.758 906.166 148.245Z"
                                transform="scale(1.86641 1.86559)"
                                stroke="#f0ddc9ff"   /* Greek Cream Stroke */
                                strokeWidth="1.5"
                                fill="#f0ddc9ff"     /* Greek Cream Fill */
                                initial={{ pathLength: 0, fillOpacity: 0, strokeOpacity: 1 }}
                                animate={{
                                    pathLength: 1,
                                    fillOpacity: 1,
                                    strokeOpacity: 0
                                }}
                                transition={{
                                    pathLength: { delay: 5.5 + 0.65, duration: 2.5, ease: "easeInOut" },
                                    fillOpacity: { delay: 8.5, duration: 1.0 },
                                    strokeOpacity: { delay: 9.5, duration: 0.5 }
                                }}
                            />
                            <motion.path
                                key="text-14"
                                d="M519.252 198.444C529.952 206.554 538.022 207.008 549.878 200.328C553.455 204.56 556.258 208.035 559.508 212.514C540.978 224.295 516.524 223.594 503.916 203.842C503.968 201.77 503.912 200.387 504.545 198.376C506.254 200.846 508.109 203.672 510.068 205.905C512.829 203.608 516.391 200.469 519.252 198.444Z"
                                transform="scale(1.86641 1.86559)"
                                stroke="#f0ddc9ff"   /* Greek Cream Stroke */
                                strokeWidth="1.5"
                                fill="#f0ddc9ff"     /* Greek Cream Fill */
                                initial={{ pathLength: 0, fillOpacity: 0, strokeOpacity: 1 }}
                                animate={{
                                    pathLength: 1,
                                    fillOpacity: 1,
                                    strokeOpacity: 0
                                }}
                                transition={{
                                    pathLength: { delay: 5.5 + 0.7000000000000001, duration: 2.5, ease: "easeInOut" },
                                    fillOpacity: { delay: 8.5, duration: 1.0 },
                                    strokeOpacity: { delay: 9.5, duration: 0.5 }
                                }}
                            />
                            <motion.path
                                key="text-15"
                                d="M967.59 172.34C978.361 172.281 989.133 172.278 999.904 172.329L999.778 182.656C991.705 182.597 984.321 182.581 976.239 182.938C975.908 187.239 975.474 190.661 974.836 194.917L982.386 194.93C987.044 194.881 995.542 196.339 993.57 202.895L992.338 203.237C990.366 202.637 989.308 200.524 988.117 198.749C980.245 198.641 972.372 198.665 964.501 198.823C965.197 190.491 966.287 180.524 967.59 172.34Z"
                                transform="scale(1.86641 1.86559)"
                                stroke="#f0ddc9ff"   /* Greek Cream Stroke */
                                strokeWidth="1.5"
                                fill="#f0ddc9ff"     /* Greek Cream Fill */
                                initial={{ pathLength: 0, fillOpacity: 0, strokeOpacity: 1 }}
                                animate={{
                                    pathLength: 1,
                                    fillOpacity: 1,
                                    strokeOpacity: 0
                                }}
                                transition={{
                                    pathLength: { delay: 5.5 + 0.75, duration: 2.5, ease: "easeInOut" },
                                    fillOpacity: { delay: 8.5, duration: 1.0 },
                                    strokeOpacity: { delay: 9.5, duration: 0.5 }
                                }}
                            />
                            <motion.path
                                key="text-16"
                                d="M1030.66 172.118C1045.56 171.34 1054.18 175.513 1053.28 192.228C1053.11 195.346 1053.97 197.781 1053.07 201.266C1051.43 202.199 1052.11 202.012 1050.01 201.68C1048.89 200.166 1049.11 192.037 1048.98 189.434C1047.4 187.896 1044.76 189.11 1044.45 188.697C1041.95 185.345 1043.54 184.674 1038.81 182.028C1020.25 178.558 1029.28 195.052 1026.7 201.078C1024.87 202.044 1025.61 201.934 1023.62 201.709C1021.9 199.074 1023.49 194.003 1021.57 189.249C1018.95 187.477 1020.21 189.735 1017.38 188.766C1013.49 180.283 1023.91 174.092 1030.66 172.118Z"
                                transform="scale(1.86641 1.86559)"
                                stroke="#f0ddc9ff"   /* Greek Cream Stroke */
                                strokeWidth="1.5"
                                fill="#f0ddc9ff"     /* Greek Cream Fill */
                                initial={{ pathLength: 0, fillOpacity: 0, strokeOpacity: 1 }}
                                animate={{
                                    pathLength: 1,
                                    fillOpacity: 1,
                                    strokeOpacity: 0
                                }}
                                transition={{
                                    pathLength: { delay: 5.5 + 0.8, duration: 2.5, ease: "easeInOut" },
                                    fillOpacity: { delay: 8.5, duration: 1.0 },
                                    strokeOpacity: { delay: 9.5, duration: 0.5 }
                                }}
                            />
                            <motion.path
                                key="text-17"
                                d="M825.154 204.369C831.417 204.287 837.682 204.285 843.945 204.362L843.765 219.947C835.702 219.277 823.619 219.572 815.225 219.567C809.372 219.478 801.359 221.256 797.802 218.592C796.423 216.762 796.845 214.178 796.914 211.783C806.256 211.439 815.824 211.541 825.187 211.535C825.049 209.251 825.132 206.683 825.154 204.369Z"
                                transform="scale(1.86641 1.86559)"
                                stroke="#f0ddc9ff"   /* Greek Cream Stroke */
                                strokeWidth="1.5"
                                fill="#f0ddc9ff"     /* Greek Cream Fill */
                                initial={{ pathLength: 0, fillOpacity: 0, strokeOpacity: 1 }}
                                animate={{
                                    pathLength: 1,
                                    fillOpacity: 1,
                                    strokeOpacity: 0
                                }}
                                transition={{
                                    pathLength: { delay: 5.5 + 0.8500000000000001, duration: 2.5, ease: "easeInOut" },
                                    fillOpacity: { delay: 8.5, duration: 1.0 },
                                    strokeOpacity: { delay: 9.5, duration: 0.5 }
                                }}
                            />
                            <motion.path
                                key="text-18"
                                d="M978.348 188.175C989.527 188.156 1001.1 191.285 1001.16 204.817C1001.21 208.973 999.56 212.97 996.594 215.882C989.754 222.582 974.904 220.745 965.167 220.635C963.949 219.311 964.448 212.546 964.497 210.456C971.785 210.789 980.533 210.36 987.928 210.175C994.277 201.81 994.15 208.01 997.491 204.834C997.61 202.847 996.949 201.041 996.165 199.245C991.856 189.369 984.408 194.88 977.52 192.104C977.148 190.4 977.655 189.985 978.348 188.175Z"
                                transform="scale(1.86641 1.86559)"
                                stroke="#f0ddc9ff"   /* Greek Cream Stroke */
                                strokeWidth="1.5"
                                fill="#f0ddc9ff"     /* Greek Cream Fill */
                                initial={{ pathLength: 0, fillOpacity: 0, strokeOpacity: 1 }}
                                animate={{
                                    pathLength: 1,
                                    fillOpacity: 1,
                                    strokeOpacity: 0
                                }}
                                transition={{
                                    pathLength: { delay: 5.5 + 0.9, duration: 2.5, ease: "easeInOut" },
                                    fillOpacity: { delay: 8.5, duration: 1.0 },
                                    strokeOpacity: { delay: 9.5, duration: 0.5 }
                                }}
                            />
                            <motion.path
                                key="text-19"
                                d="M1017.35 189.668L1018.86 190.472C1020.26 193.142 1020 201.036 1019.99 204.373C1028.64 204.164 1024.03 205.447 1030.67 210.188C1033.31 211.483 1036.57 211.017 1038.99 210.398C1047.82 208.139 1040.6 191.964 1045.28 190.355C1047.94 192.562 1046.05 199.343 1047.12 203.983L1048.14 203.99C1049.84 204.057 1051.96 203.897 1053.23 204.925C1053.61 205.823 1053.65 206.363 1053.48 207.334C1052.73 211.568 1050.31 215.321 1046.76 217.751C1033.13 227.014 1013.81 216.532 1016.58 199.72C1017.09 196.576 1016.62 193.227 1017.35 189.668Z"
                                transform="scale(1.86641 1.86559)"
                                stroke="#f0ddc9ff"   /* Greek Cream Stroke */
                                strokeWidth="1.5"
                                fill="#f0ddc9ff"     /* Greek Cream Fill */
                                initial={{ pathLength: 0, fillOpacity: 0, strokeOpacity: 1 }}
                                animate={{
                                    pathLength: 1,
                                    fillOpacity: 1,
                                    strokeOpacity: 0
                                }}
                                transition={{
                                    pathLength: { delay: 5.5 + 0.9500000000000001, duration: 2.5, ease: "easeInOut" },
                                    fillOpacity: { delay: 8.5, duration: 1.0 },
                                    strokeOpacity: { delay: 9.5, duration: 0.5 }
                                }}
                            />
                            <motion.path
                                key="text-20"
                                d="M687.484 147.675C692.488 147.912 697.541 147.649 702.551 147.472C703.019 155.063 703.045 175.441 702.443 182.743C700.135 183.037 700.749 183.282 698.989 182.349C697.261 178.877 698.128 162.816 698.206 157.689L687.349 157.6C687.148 154.302 686.777 150.896 687.484 147.675Z"
                                transform="scale(1.86641 1.86559)"
                                stroke="#f0ddc9ff"   /* Greek Cream Stroke */
                                strokeWidth="1.5"
                                fill="#f0ddc9ff"     /* Greek Cream Fill */
                                initial={{ pathLength: 0, fillOpacity: 0, strokeOpacity: 1 }}
                                animate={{
                                    pathLength: 1,
                                    fillOpacity: 1,
                                    strokeOpacity: 0
                                }}
                                transition={{
                                    pathLength: { delay: 5.5 + 1, duration: 2.5, ease: "easeInOut" },
                                    fillOpacity: { delay: 8.5, duration: 1.0 },
                                    strokeOpacity: { delay: 9.5, duration: 0.5 }
                                }}
                            />
                            <motion.path
                                key="text-21"
                                d="M503.916 203.842L503.76 203.622C500.272 198.709 497.124 190.399 498.146 184.37L499.12 184.146L498.317 184.071C501.795 186.106 502.626 193.357 504.545 198.376C503.912 200.387 503.968 201.77 503.916 203.842Z"
                                transform="scale(1.86641 1.86559)"
                                stroke="#f0ddc9ff"   /* Greek Cream Stroke */
                                strokeWidth="1.5"
                                fill="#f0ddc9ff"     /* Greek Cream Fill */
                                initial={{ pathLength: 0, fillOpacity: 0, strokeOpacity: 1 }}
                                animate={{
                                    pathLength: 1,
                                    fillOpacity: 1,
                                    strokeOpacity: 0
                                }}
                                transition={{
                                    pathLength: { delay: 5.5 + 1.05, duration: 2.5, ease: "easeInOut" },
                                    fillOpacity: { delay: 8.5, duration: 1.0 },
                                    strokeOpacity: { delay: 9.5, duration: 0.5 }
                                }}
                            />
                            <motion.path
                                key="text-dot"
                                d="M 1004, 215 a 5,5 0 1,0 10,0 a 5,5 0 1,0 -10,0"
                                transform="scale(1.86641 1.86559)"
                                stroke="#f0ddc9ff"   /* Greek Cream Stroke */
                                strokeWidth="1.5"
                                fill="#f0ddc9ff"     /* Greek Cream Fill */
                                initial={{ pathLength: 0, fillOpacity: 0, strokeOpacity: 1 }}
                                animate={{
                                    pathLength: 1,
                                    fillOpacity: 1,
                                    strokeOpacity: 0
                                }}
                                transition={{
                                    pathLength: { delay: 5.5 + 1.1, duration: 2.5, ease: "easeInOut" },
                                    fillOpacity: { delay: 8.5, duration: 1.0 },
                                    strokeOpacity: { delay: 9.5, duration: 0.5 }
                                }}
                            />
                        </motion.g>
                    </svg>

                    {/* Particles (Reduced count for perf) */}
                    <div className='particles'>
                        {[...Array(15)].map((_, i) => (
                            <motion.div
                                key={i}
                                className='particle'
                                initial={{
                                    x: Math.random() * 100 - 50,
                                    y: 100,
                                    opacity: 0,
                                    scale: Math.random() * 0.5 + 0.5,
                                }}
                                animate={{
                                    y: -100,
                                    opacity: [0, 1, 0],
                                    transition: {
                                        duration: Math.random() * 2 + 2,
                                        repeat: Infinity,
                                        delay: Math.random() * 2,
                                    },
                                }}
                                style={{
                                    left: `${Math.random() * 100}%`,
                                    top: `${Math.random() * 100}%`
                                }}
                            />
                        ))}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
