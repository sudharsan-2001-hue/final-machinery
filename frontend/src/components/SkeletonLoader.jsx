import React from "react";
import "./SkeletonLoader.css";

const Skeleton = ({ className, style }) => (
  <div className={`skeleton ${className}`} style={style}></div>
);

export const ProductCardSkeleton = () => (
  <div className="catalog-card glass-card-base">
    <div className="catalog-img-wrapper">
      <Skeleton className="catalog-image-skeleton" />
      <Skeleton className="stock-badge-skeleton" />
      <Skeleton className="category-tag-skeleton" />
    </div>
    <div className="catalog-info">
      <Skeleton className="title-skeleton" />
      <Skeleton className="shop-tag-skeleton" />
      <Skeleton className="desc-skeleton" />
      <Skeleton className="weight-skeleton" />
      <div className="catalog-pricing-details">
        <Skeleton className="price-skeleton" />
        <Skeleton className="price-skeleton" />
      </div>
      <div className="catalog-actions-group">
        <Skeleton className="button-skeleton" />
        <Skeleton className="button-skeleton" />
      </div>
    </div>
  </div>
);

export const DashboardCardSkeleton = () => (
  <div className="stat-card glass-card-base">
    <Skeleton className="stat-icon-skeleton" />
    <div className="stat-content">
      <Skeleton className="stat-value-skeleton" />
      <Skeleton className="stat-label-skeleton" />
    </div>
  </div>
);

export const OrderRowSkeleton = () => (
  <div className="order-row glass-card-base">
    <Skeleton className="order-id-skeleton" />
    <Skeleton className="order-customer-skeleton" />
    <Skeleton className="order-amount-skeleton" />
    <Skeleton className="order-status-skeleton" />
    <Skeleton className="order-date-skeleton" />
  </div>
);

export const StockRowSkeleton = () => (
  <div className="stock-row glass-card-base">
    <Skeleton className="stock-product-skeleton" />
    <Skeleton className="stock-quantity-skeleton" />
    <Skeleton className="stock-status-skeleton" />
  </div>
);

export const FullPageSkeleton = () => (
  <div className="full-page-skeleton">
    <div className="skeleton-header">
      <Skeleton className="header-logo-skeleton" />
      <Skeleton className="header-title-skeleton" />
    </div>
    <div className="skeleton-content">
      <div className="skeleton-grid">
        {[...Array(4)].map((_, i) => (
          <DashboardCardSkeleton key={i} />
        ))}
      </div>
      <div className="skeleton-list">
        {[...Array(5)].map((_, i) => (
          <OrderRowSkeleton key={i} />
        ))}
      </div>
    </div>
  </div>
);

export const OrderHistoryCardSkeleton = () => (
  <div className="order-card glass-card-base" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '20px', width: '100%', boxSizing: 'border-box' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '60%' }}>
        <Skeleton style={{ height: '24px', width: '80%' }} />
        <Skeleton style={{ height: '16px', width: '50%' }} />
      </div>
      <Skeleton style={{ height: '28px', width: '100px', borderRadius: '14px' }} />
    </div>

    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '16px', backgroundColor: 'rgba(255, 255, 255, 0.02)', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <Skeleton style={{ height: '16px', width: '100px' }} />
        <Skeleton style={{ height: '16px', width: '80px' }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <Skeleton style={{ height: '16px', width: '120px' }} />
        <Skeleton style={{ height: '16px', width: '60px' }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <Skeleton style={{ height: '16px', width: '110px' }} />
        <Skeleton style={{ height: '16px', width: '70px' }} />
      </div>
    </div>

    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '10px 0', padding: '0 10px' }}>
      {[...Array(5)].map((_, idx) => (
        <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', width: '15%' }}>
          <Skeleton style={{ height: '20px', width: '20px', borderRadius: '50%' }} />
          <Skeleton style={{ height: '12px', width: '100%' }} />
        </div>
      ))}
    </div>

    <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
      <Skeleton style={{ height: '40px', flex: 1, borderRadius: '8px' }} />
      <Skeleton style={{ height: '40px', flex: 1, borderRadius: '8px' }} />
    </div>
  </div>
);

export default Skeleton;
